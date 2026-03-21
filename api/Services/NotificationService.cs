using api.Data;
using api.Models.Enums;
using FirebaseAdmin.Messaging;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace api.Services;

public class NotificationService(IServiceScopeFactory scopeFactory, ILogger<NotificationService> logger)
    : INotificationService
{
    private const int MaxBodyLength = 120;

    public async Task SendMentionNotificationAsync(
        string mentionedUsername,
        Guid senderPlayerId,
        string senderUsername,
        string messageText)
    {
        logger.LogInformation("FCM: SendMention → looking up tokens for @{Mentioned}", mentionedUsername);

        await using var scope = scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<DamasDbContext>();

        // Exclude tokens that belong to the sender — guards against the case where
        // the sender has multiple accounts on the same device (e.g. email + Nostr)
        // and mentions their own other account.
        var tokens = await db.PlayerFcmTokens
            .Where(t => t.Player.Username == mentionedUsername && t.PlayerId != senderPlayerId)
            .Select(t => t.Token)
            .ToListAsync();

        if (tokens.Count == 0)
        {
            logger.LogInformation("FCM: No tokens found for @{Mentioned} — skipping", mentionedUsername);
            return;
        }

        logger.LogInformation("FCM: Sending mention to @{Mentioned} via {Count} token(s)", mentionedUsername, tokens.Count);

        var body = messageText.Length > MaxBodyLength
            ? string.Concat(messageText.AsSpan(0, MaxBodyLength), "…")
            : messageText;

        var multicast = new MulticastMessage
        {
            Tokens = tokens,
            Data = new Dictionary<string, string>
            {
                ["type"] = "chat_mention",
                ["senderUsername"] = senderUsername,
                ["messageText"] = body,
            },
            Notification = new Notification
            {
                Title = $"@{senderUsername} te mencionou",
                Body = body,
            },
            Android = new AndroidConfig
            {
                Priority = Priority.High,
                Notification = new AndroidNotification
                {
                    ChannelId = "chat_mentions",
                    Sound = "default",
                },
            },
            Apns = new ApnsConfig
            {
                Aps = new Aps
                {
                    Sound = "default",
                    Badge = 1,
                },
            },
        };

        var instance = FirebaseMessaging.DefaultInstance;
        if (instance is null)
        {
            logger.LogWarning("FCM: FirebaseMessaging.DefaultInstance is null — Firebase not initialized");
            return;
        }

        try
        {
            var result = await instance.SendEachForMulticastAsync(multicast);
            logger.LogInformation(
                "FCM: Mention sent — success={Success} failure={Failure}",
                result.SuccessCount, result.FailureCount);

            if (result.FailureCount > 0)
            {
                for (var i = 0; i < result.Responses.Count; i++)
                {
                    var r = result.Responses[i];
                    if (!r.IsSuccess)
                        logger.LogWarning(
                            "FCM: Token[{Index}] failed — {Code}: {Message}",
                            i, r.Exception?.MessagingErrorCode, r.Exception?.Message);
                }
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "FCM: Exception sending mention notification to @{Username}", mentionedUsername);
        }
    }

    public async Task SendReplyNotificationAsync(
        string repliedToUsername,
        Guid replierPlayerId,
        string replierUsername,
        string messageText)
    {
        logger.LogInformation("FCM: SendReply → looking up tokens for @{Mentioned}", repliedToUsername);

        await using var scope = scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<DamasDbContext>();

        var tokens = await db.PlayerFcmTokens
            .Where(t => t.Player.Username == repliedToUsername && t.PlayerId != replierPlayerId)
            .Select(t => t.Token)
            .ToListAsync();

        if (tokens.Count == 0)
        {
            logger.LogInformation("FCM: No tokens found for @{Mentioned} — skipping", repliedToUsername);
            return;
        }

        var body = messageText.Length > MaxBodyLength
            ? string.Concat(messageText.AsSpan(0, MaxBodyLength), "…")
            : messageText;

        var multicast = new MulticastMessage
        {
            Tokens = tokens,
            Data = new Dictionary<string, string>
            {
                ["type"] = "chat_reply",
                ["replierUsername"] = replierUsername,
                ["messageText"] = body,
            },
            Notification = new Notification
            {
                Title = $"@{replierUsername} respondeu você",
                Body = body,
            },
            Android = new AndroidConfig
            {
                Priority = Priority.High,
                Notification = new AndroidNotification
                {
                    ChannelId = "chat_mentions",
                    Sound = "default",
                },
            },
            Apns = new ApnsConfig
            {
                Aps = new Aps
                {
                    Sound = "default",
                    Badge = 1,
                },
            },
        };

        await SendMulticastAsync(multicast, "chat-reply", repliedToUsername);
    }

    public async Task SendGameCreatedNotificationAsync(
        Guid creatorPlayerId,
        string creatorUsername,
        Guid gameId)
    {
        logger.LogInformation("FCM: SendGameCreated → finding past opponents of @{Creator}", creatorUsername);

        await using var scope = scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<DamasDbContext>();

        var opponentIds = await db.Games
            .Where(g => g.Status == GameStatus.Completed &&
                       (g.PlayerBlackId == creatorPlayerId || g.PlayerWhiteId == creatorPlayerId))
            .Select(g => g.PlayerBlackId == creatorPlayerId ? g.PlayerWhiteId : g.PlayerBlackId)
            .Where(id => id.HasValue)
            .Select(id => id!.Value)
            .Distinct()
            .ToListAsync();

        if (opponentIds.Count == 0)
        {
            logger.LogInformation("FCM: No past opponents for @{Creator} — skipping", creatorUsername);
            return;
        }

        // Exclude tokens belonging to the creator — guards against the case where
        // the creator has multiple accounts on the same device (e.g. email + Nostr)
        // and played games between those accounts, making themselves a "past opponent".
        var tokens = await db.PlayerFcmTokens
            .Where(t => opponentIds.Contains(t.PlayerId) && t.PlayerId != creatorPlayerId)
            .Select(t => t.Token)
            .ToListAsync();

        if (tokens.Count == 0)
        {
            logger.LogInformation(
                "FCM: Found {Count} opponent(s) for @{Creator} but none have FCM tokens — skipping",
                opponentIds.Count, creatorUsername);
            return;
        }

        logger.LogInformation(
            "FCM: Sending game-created to {TokenCount} device(s) for {OpponentCount} opponent(s) of @{Creator}",
            tokens.Count, opponentIds.Count, creatorUsername);

        var multicast = new MulticastMessage
        {
            Tokens = tokens,
            Data = new Dictionary<string, string>
            {
                ["type"] = "game_created",
                ["gameId"] = gameId.ToString(),
                ["creatorUsername"] = creatorUsername,
            },
            Notification = new Notification
            {
                Title = $"{creatorUsername} está procurando adversário!",
                Body = "Toque para entrar na partida",
            },
            Android = new AndroidConfig
            {
                Priority = Priority.High,
                Notification = new AndroidNotification
                {
                    ChannelId = "game_invites",
                    Sound = "default",
                },
            },
            Apns = new ApnsConfig
            {
                Aps = new Aps
                {
                    Sound = "default",
                    Badge = 1,
                },
            },
        };

        var instance = FirebaseMessaging.DefaultInstance;
        if (instance is null)
        {
            logger.LogWarning("FCM: FirebaseMessaging.DefaultInstance is null — Firebase not initialized");
            return;
        }

        try
        {
            var result = await instance.SendEachForMulticastAsync(multicast);
            logger.LogInformation(
                "FCM: GameCreated sent by @{Creator} — success={Success} failure={Failure}",
                creatorUsername, result.SuccessCount, result.FailureCount);

            if (result.FailureCount > 0)
            {
                for (var i = 0; i < result.Responses.Count; i++)
                {
                    var r = result.Responses[i];
                    if (!r.IsSuccess)
                        logger.LogWarning(
                            "FCM: Token[{Index}] failed — {Code}: {Message}",
                            i, r.Exception?.MessagingErrorCode, r.Exception?.Message);
                }
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "FCM: Exception sending game-created notification for @{Username}", creatorUsername);
        }
    }

    public async Task SendPlayerJoinedNotificationAsync(
        Guid creatorPlayerId,
        string joinerUsername,
        Guid gameId)
    {
        logger.LogInformation(
            "FCM: SendPlayerJoined → notifying creator {CreatorId} that @{Joiner} joined game {GameId}",
            creatorPlayerId, joinerUsername, gameId);

        await using var scope = scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<DamasDbContext>();

        var tokens = await db.PlayerFcmTokens
            .Where(t => t.PlayerId == creatorPlayerId)
            .Select(t => t.Token)
            .ToListAsync();

        if (tokens.Count == 0)
        {
            logger.LogInformation("FCM: Creator {CreatorId} has no FCM tokens — skipping", creatorPlayerId);
            return;
        }

        var multicast = new MulticastMessage
        {
            Tokens = tokens,
            Data = new Dictionary<string, string>
            {
                ["type"] = "player_joined",
                ["gameId"] = gameId.ToString(),
                ["joinerUsername"] = joinerUsername,
            },
            Notification = new Notification
            {
                Title = $"{joinerUsername} entrou na sua partida!",
                Body = "Toque para jogar",
            },
            Android = new AndroidConfig
            {
                Priority = Priority.High,
                Notification = new AndroidNotification { ChannelId = "game_invites", Sound = "default" },
            },
            Apns = new ApnsConfig { Aps = new Aps { Sound = "default", Badge = 1 } },
        };

        await SendMulticastAsync(multicast, "player-joined", creatorPlayerId.ToString());
    }

    public async Task SendNewUserNotificationAsync(string newUsername, bool isNostr)
    {
        logger.LogInformation("FCM: SendNewUser → notifying admins about new user @{Username}", newUsername);

        await using var scope = scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<DamasDbContext>();

        var tokens = await db.PlayerFcmTokens
            .Where(t => t.Player.Role == Models.PlayerRole.Admin)
            .Select(t => t.Token)
            .ToListAsync();

        if (tokens.Count == 0)
        {
            logger.LogInformation("FCM: No admin FCM tokens found — skipping new-user notification");
            return;
        }

        var via = isNostr ? "Nostr" : "e-mail";
        var multicast = new MulticastMessage
        {
            Tokens = tokens,
            Data = new Dictionary<string, string>
            {
                ["type"] = "new_user",
                ["username"] = newUsername,
                ["isNostr"] = isNostr ? "true" : "false",
            },
            Notification = new Notification
            {
                Title = $"Novo jogador: {newUsername}",
                Body = $"Entrou pelo {via}. Venha jogar!",
            },
            Android = new AndroidConfig
            {
                Priority = Priority.High,
                Notification = new AndroidNotification { ChannelId = "game_invites", Sound = "default" },
            },
            Apns = new ApnsConfig { Aps = new Aps { Sound = "default", Badge = 1 } },
        };

        await SendMulticastAsync(multicast, "new-user", newUsername);
    }

    // ── Shared FCM dispatch ───────────────────────────────────────────────────

    private async Task SendMulticastAsync(MulticastMessage multicast, string context, string target)
    {
        var instance = FirebaseMessaging.DefaultInstance;
        if (instance is null)
        {
            logger.LogWarning("FCM: FirebaseMessaging.DefaultInstance is null — Firebase not initialized");
            return;
        }

        try
        {
            var result = await instance.SendEachForMulticastAsync(multicast);
            logger.LogInformation(
                "FCM: [{Context}] → {Target} — success={Success} failure={Failure}",
                context, target, result.SuccessCount, result.FailureCount);

            if (result.FailureCount > 0)
            {
                for (var i = 0; i < result.Responses.Count; i++)
                {
                    var r = result.Responses[i];
                    if (!r.IsSuccess)
                        logger.LogWarning(
                            "FCM: [{Context}] Token[{Index}] failed — {Code}: {Message}",
                            context, i, r.Exception?.MessagingErrorCode, r.Exception?.Message);
                }
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "FCM: Exception in [{Context}] for {Target}", context, target);
        }
    }
}

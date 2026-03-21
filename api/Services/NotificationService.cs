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

    // ── Public methods ────────────────────────────────────────────────────────

    public async Task SendMentionNotificationAsync(
        string mentionedUsername,
        Guid senderPlayerId,
        string senderUsername,
        string messageText)
    {
        logger.LogInformation("FCM: SendMention → looking up tokens for @{Mentioned}", mentionedUsername);

        await using var scope = scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<DamasDbContext>();

        var tokens = await db.PlayerFcmTokens
            .Where(t => t.Player.Username == mentionedUsername && t.PlayerId != senderPlayerId)
            .Select(t => t.Token)
            .ToListAsync();

        if (tokens.Count == 0)
        {
            logger.LogInformation("FCM: No tokens found for @{Mentioned} — skipping", mentionedUsername);
            return;
        }

        var body = Truncate(messageText);

        await SendMulticastAsync(
            new MulticastMessage
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
                    Notification = new AndroidNotification { ChannelId = "chat_mentions", Sound = "default" },
                },
                Apns = new ApnsConfig { Aps = new Aps { Sound = "default", Badge = 1 } },
            },
            context: "chat-mention",
            target: mentionedUsername,
            db: db);
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

        var body = Truncate(messageText);

        await SendMulticastAsync(
            new MulticastMessage
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
                    Notification = new AndroidNotification { ChannelId = "chat_mentions", Sound = "default" },
                },
                Apns = new ApnsConfig { Aps = new Aps { Sound = "default", Badge = 1 } },
            },
            context: "chat-reply",
            target: repliedToUsername,
            db: db);
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

        await SendMulticastAsync(
            new MulticastMessage
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
                    Notification = new AndroidNotification { ChannelId = "game_invites", Sound = "default" },
                },
                Apns = new ApnsConfig { Aps = new Aps { Sound = "default", Badge = 1 } },
            },
            context: "game-created",
            target: creatorUsername,
            db: db);
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

        await SendMulticastAsync(
            new MulticastMessage
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
            },
            context: "player-joined",
            target: creatorPlayerId.ToString(),
            db: db);
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
        await SendMulticastAsync(
            new MulticastMessage
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
            },
            context: "new-user",
            target: newUsername,
            db: db);
    }

    // ── Shared FCM dispatch with stale-token cleanup ──────────────────────────

    /// <summary>
    /// Sends a multicast FCM message and removes any tokens that Firebase
    /// reports as unregistered (expired / app uninstalled / reinstalled).
    /// </summary>
    private async Task SendMulticastAsync(
        MulticastMessage multicast,
        string context,
        string target,
        DamasDbContext db)
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
                var staleTokens = new List<string>();

                for (var i = 0; i < result.Responses.Count; i++)
                {
                    var r = result.Responses[i];
                    if (r.IsSuccess) continue;

                    logger.LogWarning(
                        "FCM: [{Context}] Token[{Index}] failed — {Code}: {Message}",
                        context, i, r.Exception?.MessagingErrorCode, r.Exception?.Message);

                    // Unregistered = app was uninstalled, reinstalled, or token expired.
                    // SenderIdMismatch = token belongs to a different Firebase project.
                    // Both cases mean the token is permanently invalid and must be removed.
                    if (r.Exception?.MessagingErrorCode is
                        MessagingErrorCode.Unregistered or
                        MessagingErrorCode.SenderIdMismatch)
                    {
                        staleTokens.Add(multicast.Tokens[i]);
                    }
                }

                if (staleTokens.Count > 0)
                {
                    await db.PlayerFcmTokens
                        .Where(t => staleTokens.Contains(t.Token))
                        .ExecuteDeleteAsync();

                    logger.LogInformation(
                        "FCM: [{Context}] Purged {Count} stale token(s) from database",
                        context, staleTokens.Count);
                }
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "FCM: Exception in [{Context}] for {Target}", context, target);
        }
    }

    private static string Truncate(string text) =>
        text.Length > MaxBodyLength
            ? string.Concat(text.AsSpan(0, MaxBodyLength), "…")
            : text;
}

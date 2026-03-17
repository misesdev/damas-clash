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
        string senderUsername,
        string messageText)
    {
        logger.LogInformation("FCM: SendMention → looking up tokens for @{Mentioned}", mentionedUsername);

        await using var scope = scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<DamasDbContext>();

        var tokens = await db.PlayerFcmTokens
            .Where(t => t.Player.Username == mentionedUsername)
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
            .Where(t => opponentIds.Contains(t.PlayerId))
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
}

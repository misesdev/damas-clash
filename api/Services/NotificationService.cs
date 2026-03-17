using api.Data;
using api.Models.Enums;
using FirebaseAdmin.Messaging;
using Microsoft.EntityFrameworkCore;

namespace api.Services;

public class NotificationService(DamasDbContext db, ILogger<NotificationService> logger)
    : INotificationService
{
    private const int MaxBodyLength = 120;

    public async Task SendMentionNotificationAsync(
        string mentionedUsername,
        string senderUsername,
        string messageText)
    {
        var tokens = await db.PlayerFcmTokens
            .Where(t => t.Player.Username == mentionedUsername)
            .Select(t => t.Token)
            .ToListAsync();

        if (tokens.Count == 0) return;

        var body = messageText.Length > MaxBodyLength
            ? string.Concat(messageText.AsSpan(0, MaxBodyLength), "…")
            : messageText;

        var multicast = new MulticastMessage
        {
            Tokens = tokens,
            // Data payload — consumed by the app in the foreground handler
            Data = new Dictionary<string, string>
            {
                ["type"] = "chat_mention",
                ["senderUsername"] = senderUsername,
                ["messageText"] = body,
            },
            // Notification payload — shown by the OS when the app is in the background/killed
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
            logger.LogDebug("FCM: Firebase not initialized — skipping mention notification to @{Username}", mentionedUsername);
            return;
        }

        try
        {
            var result = await instance.SendEachForMulticastAsync(multicast);

            if (result.FailureCount > 0)
                logger.LogWarning(
                    "FCM: {FailureCount}/{Total} tokens failed for mention to @{Username}",
                    result.FailureCount, tokens.Count, mentionedUsername);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "FCM: Failed to send mention notification to @{Username}", mentionedUsername);
        }
    }

    public async Task SendGameCreatedNotificationAsync(
        Guid creatorPlayerId,
        string creatorUsername,
        Guid gameId)
    {
        // Find all players who have previously played against the creator
        var opponentIds = await db.Games
            .Where(g => g.Status == GameStatus.Completed &&
                       (g.PlayerBlackId == creatorPlayerId || g.PlayerWhiteId == creatorPlayerId))
            .Select(g => g.PlayerBlackId == creatorPlayerId ? g.PlayerWhiteId : g.PlayerBlackId)
            .Where(id => id.HasValue)
            .Select(id => id!.Value)
            .Distinct()
            .ToListAsync();

        if (opponentIds.Count == 0) return;

        var tokens = await db.PlayerFcmTokens
            .Where(t => opponentIds.Contains(t.PlayerId))
            .Select(t => t.Token)
            .ToListAsync();

        if (tokens.Count == 0) return;

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
            logger.LogDebug("FCM: Firebase not initialized — skipping game-created notification for @{Username}", creatorUsername);
            return;
        }

        try
        {
            var result = await instance.SendEachForMulticastAsync(multicast);

            if (result.FailureCount > 0)
                logger.LogWarning(
                    "FCM: {FailureCount}/{Total} tokens failed for game-created notification by @{Username}",
                    result.FailureCount, tokens.Count, creatorUsername);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "FCM: Failed to send game-created notification for @{Username}", creatorUsername);
        }
    }
}

namespace api.Services;

public interface INotificationService
{
    /// <summary>
    /// Sends a FCM push notification to all registered devices of
    /// <paramref name="mentionedUsername"/> informing them they were mentioned
    /// in the live chat by <paramref name="senderUsername"/>.
    /// Fails silently — callers must not depend on the outcome.
    /// </summary>
    Task SendMentionNotificationAsync(
        string mentionedUsername,
        Guid senderPlayerId,
        string senderUsername,
        string messageText);

    /// <summary>
    /// Sends a FCM push notification to all players who have previously played
    /// against <paramref name="creatorPlayerId"/>, informing them the player
    /// created a new game and is waiting for an opponent.
    /// Fails silently — callers must not depend on the outcome.
    /// </summary>
    Task SendGameCreatedNotificationAsync(
        Guid creatorPlayerId,
        string creatorUsername,
        Guid gameId);
}

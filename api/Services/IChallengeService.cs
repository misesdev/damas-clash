namespace api.Services;

public record ChallengeEntry(
    Guid FromPlayerId,
    string FromUsername,
    Guid ToPlayerId,
    DateTimeOffset SentAt);

/// <summary>
/// In-memory, ephemeral challenge tracker. Challenges expire after 60 seconds.
/// All operations are O(1) and thread-safe.
/// </summary>
public interface IChallengeService
{
    void Send(Guid fromPlayerId, string fromUsername, Guid toPlayerId);
    ChallengeEntry? Accept(Guid fromPlayerId, Guid toPlayerId);
    bool Decline(Guid fromPlayerId, Guid toPlayerId, out string? fromUsername);
    bool Cancel(Guid fromPlayerId, Guid toPlayerId);
    bool HasPending(Guid fromPlayerId, Guid toPlayerId);
}

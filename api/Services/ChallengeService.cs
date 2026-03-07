using System.Collections.Concurrent;

namespace api.Services;

public class ChallengeService : IChallengeService
{
    private static readonly TimeSpan Ttl = TimeSpan.FromSeconds(60);

    // Key: (challengerId, targetId) — each pair holds at most one pending challenge
    private readonly ConcurrentDictionary<(Guid, Guid), ChallengeEntry> _challenges = new();

    public void Send(Guid fromPlayerId, string fromUsername, Guid toPlayerId)
    {
        var entry = new ChallengeEntry(fromPlayerId, fromUsername, toPlayerId, DateTimeOffset.UtcNow);
        _challenges[(fromPlayerId, toPlayerId)] = entry;
    }

    public ChallengeEntry? Accept(Guid fromPlayerId, Guid toPlayerId)
    {
        if (!_challenges.TryRemove((fromPlayerId, toPlayerId), out var entry))
            return null;
        return DateTimeOffset.UtcNow - entry.SentAt > Ttl ? null : entry;
    }

    public bool Decline(Guid fromPlayerId, Guid toPlayerId, out string? fromUsername)
    {
        if (_challenges.TryRemove((fromPlayerId, toPlayerId), out var entry))
        {
            fromUsername = entry.FromUsername;
            return true;
        }
        fromUsername = null;
        return false;
    }

    public bool Cancel(Guid fromPlayerId, Guid toPlayerId) =>
        _challenges.TryRemove((fromPlayerId, toPlayerId), out _);

    public bool HasPending(Guid fromPlayerId, Guid toPlayerId) =>
        _challenges.TryGetValue((fromPlayerId, toPlayerId), out var e) &&
        DateTimeOffset.UtcNow - e.SentAt <= Ttl;
}

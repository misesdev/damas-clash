using System.Collections.Concurrent;
using System.Security.Cryptography;

namespace api.Services;

public class NostrChallengeStore : INostrChallengeStore
{
    private readonly record struct ChallengeEntry(string Pubkey, DateTimeOffset Expiry);

    private readonly ConcurrentDictionary<string, ChallengeEntry> _challenges = new();
    private static readonly TimeSpan Expiry = TimeSpan.FromMinutes(5);

    public string Generate(string pubkey)
    {
        var bytes = RandomNumberGenerator.GetBytes(32);
        var challenge = Convert.ToHexString(bytes).ToLowerInvariant();
        _challenges[challenge] = new ChallengeEntry(pubkey, DateTimeOffset.UtcNow.Add(Expiry));

        // Opportunistically clean up expired entries to bound memory usage.
        var now = DateTimeOffset.UtcNow;
        foreach (var key in _challenges.Keys)
            if (_challenges.TryGetValue(key, out var entry) && entry.Expiry < now)
                _challenges.TryRemove(key, out _);

        return challenge;
    }

    public bool ValidateAndConsume(string challenge, string pubkey)
    {
        if (!_challenges.TryRemove(challenge, out var entry))
            return false;

        // Reject expired challenges and challenges issued for a different pubkey.
        return DateTimeOffset.UtcNow <= entry.Expiry &&
               string.Equals(entry.Pubkey, pubkey, StringComparison.OrdinalIgnoreCase);
    }
}

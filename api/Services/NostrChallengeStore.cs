using System.Collections.Concurrent;
using System.Security.Cryptography;

namespace api.Services;

public class NostrChallengeStore : INostrChallengeStore
{
    private readonly ConcurrentDictionary<string, DateTimeOffset> _challenges = new();
    private static readonly TimeSpan Expiry = TimeSpan.FromMinutes(5);

    public string Generate()
    {
        var bytes = RandomNumberGenerator.GetBytes(32);
        var challenge = Convert.ToHexString(bytes).ToLowerInvariant();
        _challenges[challenge] = DateTimeOffset.UtcNow.Add(Expiry);
        // Clean up expired entries opportunistically
        var now = DateTimeOffset.UtcNow;
        foreach (var key in _challenges.Keys)
            if (_challenges.TryGetValue(key, out var exp) && exp < now)
                _challenges.TryRemove(key, out _);
        return challenge;
    }

    public bool ValidateAndConsume(string challenge)
    {
        if (!_challenges.TryRemove(challenge, out var expiry))
            return false;
        return DateTimeOffset.UtcNow <= expiry;
    }
}

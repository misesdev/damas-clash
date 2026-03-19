namespace api.Services;

public interface INostrChallengeStore
{
    /// <summary>Generates a one-time challenge bound to the given pubkey.</summary>
    string Generate(string pubkey);

    /// <summary>
    /// Validates and atomically consumes a challenge.
    /// Returns false if the challenge is unknown, expired, or was issued for a different pubkey.
    /// </summary>
    bool ValidateAndConsume(string challenge, string pubkey);
}

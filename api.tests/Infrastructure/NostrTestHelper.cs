using System.IO;
using System.Security.Cryptography;
using System.Text.Encodings.Web;
using System.Text.Json;
using NBitcoin.Secp256k1;

namespace api.tests.Infrastructure;

/// <summary>
/// Generates real BIP-340 Schnorr-signed Nostr events for integration tests.
/// Mirrors the canonical-JSON serialization used by AuthService.VerifyNostrEvent.
/// </summary>
public static class NostrTestHelper
{
    /// <summary>
    /// Generates a random Secp256k1 key pair.
    /// Returns (privateKeyBytes, pubkeyHex).
    /// </summary>
    public static (byte[] privBytes, string pubkeyHex) GenerateKeyPair()
    {
        var privBytes = new byte[32];
        RandomNumberGenerator.Fill(privBytes);

        var privKey = ECPrivKey.Create(privBytes);
        var xOnlyPub = privKey.CreateXOnlyPubKey();

        var pubBytes = new byte[32];
        xOnlyPub.WriteToSpan(pubBytes);

        return (privBytes, Convert.ToHexString(pubBytes).ToLowerInvariant());
    }

    /// <summary>
    /// Builds a signed Nostr auth event (kind 22242) for the given challenge.
    /// Returns an anonymous object matching the NostrEventLoginRequest DTO shape.
    /// </summary>
    public static object BuildSignedAuthEvent(
        byte[] privBytes,
        string pubkeyHex,
        string challenge,
        long? createdAt = null)
    {
        var ts = createdAt ?? DateTimeOffset.UtcNow.ToUnixTimeSeconds();

        string[][] tags = [["challenge", challenge]];
        const string content = "Damas Clash authentication";
        const int kind = 22242;

        // Canonical serialization matches AuthService.VerifyNostrEvent
        using var ms = new MemoryStream();
        using var writer = new Utf8JsonWriter(ms, new JsonWriterOptions
        {
            Indented = false,
            Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
        });

        writer.WriteStartArray();
        writer.WriteNumberValue(0);
        writer.WriteStringValue(pubkeyHex);
        writer.WriteNumberValue(ts);
        writer.WriteNumberValue(kind);
        writer.WriteStartArray();
        foreach (var tag in tags)
        {
            writer.WriteStartArray();
            foreach (var t in tag) writer.WriteStringValue(t);
            writer.WriteEndArray();
        }
        writer.WriteEndArray();
        writer.WriteStringValue(content);
        writer.WriteEndArray();
        writer.Flush();

        var idBytes = System.Security.Cryptography.SHA256.HashData(ms.ToArray());
        var id = Convert.ToHexString(idBytes).ToLowerInvariant();

        var privKey = ECPrivKey.Create(privBytes);
        if (!privKey.TrySignBIP340(idBytes, null, out var schnorrSig) || schnorrSig is null)
            throw new InvalidOperationException("BIP-340 signing failed");

        var sigBytes = new byte[64];
        schnorrSig.WriteToSpan(sigBytes);
        var sig = Convert.ToHexString(sigBytes).ToLowerInvariant();

        return new
        {
            @event = new
            {
                id,
                pubkey = pubkeyHex,
                created_at = ts,
                kind,
                tags,
                content,
                sig,
            }
        };
    }
}

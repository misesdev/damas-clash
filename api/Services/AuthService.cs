using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using api.Data;
using api.DTOs.Auth;
using api.Models;
using Google.Apis.Auth;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using NBitcoin.Secp256k1;

namespace api.Services;

public class AuthService(
    DamasDbContext db,
    IEmailService emailService,
    ITokenService tokenService,
    IConfiguration configuration,
    INostrChallengeStore nostrChallengeStore,
    ILogger<AuthService> logger) : IAuthService
{
    public async Task<ServiceResult<RegisterResponse>> RegisterAsync(RegisterRequest req, CancellationToken ct = default)
    {
        if (await db.Players.AnyAsync(p => p.Email == req.Email, ct))
            return ServiceResult<RegisterResponse>.Fail("email_taken");

        if (await db.Players.AnyAsync(p => p.Username == req.Username, ct))
            return ServiceResult<RegisterResponse>.Fail("username_taken");

        var code = GenerateCode();

        var player = new Player
        {
            Id = Guid.NewGuid(),
            Username = req.Username,
            Email = req.Email,
            IsEmailConfirmed = false,
            EmailConfirmationCode = code,
            EmailConfirmationCodeExpiry = DateTimeOffset.UtcNow.AddMinutes(15),
            CreatedAt = DateTimeOffset.UtcNow
        };

        db.Players.Add(player);
        await db.SaveChangesAsync(ct);

        await emailService.SendConfirmationEmailAsync(player.Email, code, ct);

        return ServiceResult<RegisterResponse>.Ok(
            new RegisterResponse(player.Id, player.Username, player.Email, player.CreatedAt));
    }

    public async Task<ServiceResult<LoginResponse>> ConfirmEmailAsync(ConfirmEmailRequest req, CancellationToken ct = default)
    {
        var player = await db.Players.FirstOrDefaultAsync(p => p.Email == req.Email, ct);

        if (player is null ||
            player.EmailConfirmationCode != req.Code ||
            player.EmailConfirmationCodeExpiry < DateTimeOffset.UtcNow)
            return ServiceResult<LoginResponse>.Fail("invalid_or_expired_code");

        player.IsEmailConfirmed = true;
        player.EmailConfirmationCode = null;
        player.EmailConfirmationCodeExpiry = null;

        var refreshToken = tokenService.GenerateRefreshToken();
        player.RefreshToken = refreshToken;
        player.RefreshTokenExpiry = DateTimeOffset.UtcNow.AddDays(30);

        await db.SaveChangesAsync(ct);

        var tokenResult = tokenService.Generate(player);
        return ServiceResult<LoginResponse>.Ok(
            new LoginResponse(tokenResult.Token, refreshToken, tokenResult.ExpiresAt,
                player.Id, player.Username, player.Email, player.AvatarUrl, player.NostrPubKey));
    }

    public async Task<ServiceResult<SendLoginCodeResponse>> LoginAsync(LoginRequest req, CancellationToken ct = default)
    {
        var identifier = req.Identifier.Trim();
        var player = await db.Players.FirstOrDefaultAsync(
            p => p.Email == identifier || p.Username == identifier, ct);

        if (player is null)
            return ServiceResult<SendLoginCodeResponse>.Fail("user_not_found");

        var code = GenerateCode();
        player.LoginCode = code;
        player.LoginCodeExpiry = DateTimeOffset.UtcNow.AddMinutes(15);

        await db.SaveChangesAsync(ct);
        await emailService.SendLoginCodeAsync(player.Email, code, ct);

        return ServiceResult<SendLoginCodeResponse>.Ok(new SendLoginCodeResponse(player.Email));
    }

    public async Task<ServiceResult<LoginResponse>> VerifyLoginAsync(VerifyLoginRequest req, CancellationToken ct = default)
    {
        var player = await db.Players.FirstOrDefaultAsync(p => p.Email == req.Email, ct);

        if (player is null ||
            player.LoginCode != req.Code ||
            player.LoginCodeExpiry < DateTimeOffset.UtcNow)
            return ServiceResult<LoginResponse>.Fail("invalid_or_expired_code");

        player.LoginCode = null;
        player.LoginCodeExpiry = null;
        player.IsEmailConfirmed = true;

        var refreshToken = tokenService.GenerateRefreshToken();
        player.RefreshToken = refreshToken;
        player.RefreshTokenExpiry = DateTimeOffset.UtcNow.AddDays(30);

        await db.SaveChangesAsync(ct);

        var tokenResult = tokenService.Generate(player);
        return ServiceResult<LoginResponse>.Ok(
            new LoginResponse(tokenResult.Token, refreshToken, tokenResult.ExpiresAt,
                player.Id, player.Username, player.Email, player.AvatarUrl, player.NostrPubKey));
    }

    public async Task<ServiceResult<LoginResponse>> RefreshAsync(string refreshToken, CancellationToken ct = default)
    {
        var player = await db.Players.FirstOrDefaultAsync(
            p => p.RefreshToken == refreshToken, ct);

        if (player is null || player.RefreshTokenExpiry < DateTimeOffset.UtcNow)
            return ServiceResult<LoginResponse>.Fail("invalid_or_expired_token");

        var newRefreshToken = tokenService.GenerateRefreshToken();
        player.RefreshToken = newRefreshToken;
        player.RefreshTokenExpiry = DateTimeOffset.UtcNow.AddDays(30);

        await db.SaveChangesAsync(ct);

        var tokenResult = tokenService.Generate(player);
        return ServiceResult<LoginResponse>.Ok(
            new LoginResponse(tokenResult.Token, newRefreshToken, tokenResult.ExpiresAt,
                player.Id, player.Username, player.Email, player.AvatarUrl, player.NostrPubKey));
    }

    public async Task<ServiceResult<string>> ResendConfirmationAsync(ResendConfirmationRequest req, CancellationToken ct = default)
    {
        var player = await db.Players.FirstOrDefaultAsync(p => p.Email == req.Email, ct);

        if (player is null || player.IsEmailConfirmed)
            return ServiceResult<string>.Fail("invalid_request");

        var code = GenerateCode();
        player.EmailConfirmationCode = code;
        player.EmailConfirmationCodeExpiry = DateTimeOffset.UtcNow.AddMinutes(15);

        await db.SaveChangesAsync(ct);
        await emailService.SendConfirmationEmailAsync(player.Email, code, ct);

        return ServiceResult<string>.Ok("sent");
    }

    public async Task<ServiceResult<string>> RequestEmailChangeAsync(Guid playerId, string newEmail, CancellationToken ct = default)
    {
        if (await db.Players.AnyAsync(p => p.Email == newEmail, ct))
            return ServiceResult<string>.Fail("email_taken");

        var player = await db.Players.FindAsync([playerId], ct);
        if (player is null)
            return ServiceResult<string>.NotFound("player_not_found");

        var code = GenerateCode();
        player.PendingEmail = newEmail;
        player.EmailChangeCode = code;
        player.EmailChangeCodeExpiry = DateTimeOffset.UtcNow.AddMinutes(15);

        await db.SaveChangesAsync(ct);
        await emailService.SendEmailChangeCodeAsync(newEmail, code, ct);

        return ServiceResult<string>.Ok("sent");
    }

    public async Task<ServiceResult<string>> ConfirmEmailChangeAsync(Guid playerId, string newEmail, string code, CancellationToken ct = default)
    {
        var player = await db.Players.FindAsync([playerId], ct);

        if (player is null ||
            player.PendingEmail != newEmail ||
            player.EmailChangeCode != code ||
            player.EmailChangeCodeExpiry < DateTimeOffset.UtcNow)
            return ServiceResult<string>.Fail("invalid_or_expired_code");

        player.Email = newEmail;
        player.PendingEmail = null;
        player.EmailChangeCode = null;
        player.EmailChangeCodeExpiry = null;

        await db.SaveChangesAsync(ct);

        return ServiceResult<string>.Ok("changed");
    }

    public async Task<ServiceResult<string>> DeleteAccountAsync(Guid playerId, CancellationToken ct = default)
    {
        var player = await db.Players.FindAsync([playerId], ct);

        if (player is null)
            return ServiceResult<string>.NotFound("player_not_found");

        db.Players.Remove(player);
        await db.SaveChangesAsync(ct);

        return ServiceResult<string>.Ok("deleted");
    }

    public async Task<ServiceResult<LoginResponse>> GoogleAuthAsync(string idToken, CancellationToken ct = default)
    {
        GoogleJsonWebSignature.Payload payload;
        try
        {
            var clientId = configuration["Google:ClientId"];
            var settings = string.IsNullOrEmpty(clientId)
                ? new GoogleJsonWebSignature.ValidationSettings()
                : new GoogleJsonWebSignature.ValidationSettings { Audience = [clientId] };
            payload = await GoogleJsonWebSignature.ValidateAsync(idToken, settings);
        }
        catch
        {
            return ServiceResult<LoginResponse>.Fail("invalid_google_token");
        }

        var googleId = payload.Subject;
        var email = payload.Email;

        // Find existing player by GoogleId or by email
        var player = await db.Players.FirstOrDefaultAsync(
            p => p.GoogleId == googleId || p.Email == email, ct);

        if (player is null)
        {
            // Create a new player
            var username = await GenerateUniqueUsernameAsync(payload.Name, ct);
            player = new Player
            {
                Id = Guid.NewGuid(),
                Username = username,
                Email = email,
                GoogleId = googleId,
                IsEmailConfirmed = true,
                CreatedAt = DateTimeOffset.UtcNow,
            };
            db.Players.Add(player);
        }
        else
        {
            // Link Google account if not already linked
            if (player.GoogleId != googleId)
                player.GoogleId = googleId;

            player.IsEmailConfirmed = true;
        }

        var refreshToken = tokenService.GenerateRefreshToken();
        player.RefreshToken = refreshToken;
        player.RefreshTokenExpiry = DateTimeOffset.UtcNow.AddDays(30);

        await db.SaveChangesAsync(ct);

        var tokenResult = tokenService.Generate(player);
        return ServiceResult<LoginResponse>.Ok(
            new LoginResponse(tokenResult.Token, refreshToken, tokenResult.ExpiresAt,
                player.Id, player.Username, player.Email, player.AvatarUrl, player.NostrPubKey));
    }

    public async Task<ServiceResult<LoginResponse>> NostrAuthAsync(NostrLoginRequest req, CancellationToken ct = default)
    {
        logger.LogDebug("NostrAuth: pubkey={Pubkey} sigLen={SigLen} challenge={Challenge}",
            req.Pubkey[..Math.Min(16, req.Pubkey.Length)],
            req.Sig.Length,
            req.Challenge);

        // 1. Validate and consume challenge (single-use, 5-min window)
        var challengeValid = nostrChallengeStore.ValidateAndConsume(req.Challenge);
        logger.LogDebug("NostrAuth: challenge valid={Valid}", challengeValid);
        if (!challengeValid)
            return ServiceResult<LoginResponse>.Fail("invalid_challenge");

        // 2. Verify BIP-340 Schnorr signature over SHA-256(challenge)
        var sigValid = VerifySchnorr(req.Pubkey, req.Challenge, req.Sig, logger);
        logger.LogDebug("NostrAuth: signature valid={Valid}", sigValid);
        if (!sigValid)
            return ServiceResult<LoginResponse>.Fail("invalid_signature");

        // 3. Find or create player
        var player = await db.Players.FirstOrDefaultAsync(p => p.NostrPubKey == req.Pubkey, ct);
        if (player is null)
        {
            var username = await GenerateUniqueUsernameAsync(req.Username, ct);
            player = new Player
            {
                Id = Guid.NewGuid(),
                NostrPubKey = req.Pubkey,
                Username = username,
                IsEmailConfirmed = true,
                AvatarUrl = req.AvatarUrl,
                CreatedAt = DateTimeOffset.UtcNow,
            };
            db.Players.Add(player);
        }
        else if (req.AvatarUrl is not null && player.AvatarUrl != req.AvatarUrl)
        {
            player.AvatarUrl = req.AvatarUrl;
        }

        var refreshToken = tokenService.GenerateRefreshToken();
        player.RefreshToken = refreshToken;
        player.RefreshTokenExpiry = DateTimeOffset.UtcNow.AddDays(30);
        await db.SaveChangesAsync(ct);

        var tokenResult = tokenService.Generate(player);
        return ServiceResult<LoginResponse>.Ok(
            new LoginResponse(tokenResult.Token, refreshToken, tokenResult.ExpiresAt,
                player.Id, player.Username, player.Email, player.AvatarUrl, player.NostrPubKey));
    }

/// <summary>
    /// Verifies a BIP-340 Schnorr signature where the message is SHA-256(UTF-8(challenge)).
    /// </summary>
    private static bool VerifySchnorr(string pubkeyHex, string challenge, string sigHex, ILogger? log = null)
    {
        try
        {
            var pubBytes = Convert.FromHexString(pubkeyHex);
            var sigBytes = Convert.FromHexString(sigHex);
            var msgBytes = System.Security.Cryptography.SHA256.HashData(Encoding.UTF8.GetBytes(challenge));
            log?.LogDebug("VerifySchnorr: pubLen={PubLen} sigLen={SigLen} msgHash={MsgHash}",
                pubBytes.Length, sigBytes.Length, Convert.ToHexString(msgBytes)[..16]);
            if (!ECXOnlyPubKey.TryCreate(pubBytes, Context.Instance, out var xOnlyPub) || xOnlyPub is null)
            {
                log?.LogDebug("VerifySchnorr: ECXOnlyPubKey.TryCreate failed");
                return false;
            }
            if (!SecpSchnorrSignature.TryCreate(sigBytes, out var sig) || sig is null)
            {
                log?.LogDebug("VerifySchnorr: SecpSchnorrSignature.TryCreate failed");
                return false;
            }
            var result = xOnlyPub.SigVerifyBIP340(sig, msgBytes);
            log?.LogDebug("VerifySchnorr: SigVerifyBIP340={Result}", result);
            return result;
        }
        catch (Exception ex)
        {
            log?.LogDebug("VerifySchnorr: exception={Msg}", ex.Message);
            return false;
        }
    }

private async Task<string> GenerateUniqueUsernameAsync(string? displayName, CancellationToken ct)
    {
        var base_ = string.IsNullOrWhiteSpace(displayName)
            ? "player"
            : Regex.Replace(Regex.Replace(displayName.ToLowerInvariant(), @"[^a-z0-9]", "_"), @"_+", "_").Trim('_');

        if (base_.Length < 3) base_ = "player_" + base_;
        if (base_.Length > 47) base_ = base_[..47];

        var candidate = base_;
        var counter = 1;
        while (await db.Players.AnyAsync(p => p.Username == candidate, ct))
            candidate = $"{base_}_{counter++}";

        return candidate;
    }

    private static string GenerateCode() =>
        RandomNumberGenerator.GetInt32(100_000, 1_000_000).ToString("D6");
}

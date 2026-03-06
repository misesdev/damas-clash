using System.Security.Cryptography;
using api.Data;
using api.DTOs.Auth;
using api.Models;
using Microsoft.EntityFrameworkCore;

namespace api.Services;

public class AuthService(
    DamasDbContext db,
    IEmailService emailService,
    ITokenService tokenService) : IAuthService
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

    public async Task<ServiceResult<string>> ConfirmEmailAsync(ConfirmEmailRequest req, CancellationToken ct = default)
    {
        var player = await db.Players.FirstOrDefaultAsync(p => p.Email == req.Email, ct);

        if (player is null ||
            player.EmailConfirmationCode != req.Code ||
            player.EmailConfirmationCodeExpiry < DateTimeOffset.UtcNow)
            return ServiceResult<string>.Fail("invalid_or_expired_code");

        player.IsEmailConfirmed = true;
        player.EmailConfirmationCode = null;
        player.EmailConfirmationCodeExpiry = null;

        await db.SaveChangesAsync(ct);

        return ServiceResult<string>.Ok("confirmed");
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
                player.Id, player.Username, player.Email, player.AvatarUrl));
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
                player.Id, player.Username, player.Email, player.AvatarUrl));
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

    private static string GenerateCode() =>
        RandomNumberGenerator.GetInt32(100_000, 1_000_000).ToString("D6");
}

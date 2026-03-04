using System.Security.Cryptography;
using api.Data;
using api.DTOs.Auth;
using api.Models;
using Microsoft.EntityFrameworkCore;

namespace api.Services;

public class AuthService(
    DamasDbContext db,
    IPasswordHasher passwordHasher,
    IEmailService emailService,
    ITokenService tokenService) : IAuthService
{
    public async Task<ServiceResult<RegisterResponse>> RegisterAsync(RegisterRequest req, CancellationToken ct = default)
    {
        if (await db.Players.AnyAsync(p => p.Email == req.Email, ct))
            return ServiceResult<RegisterResponse>.Fail("email_taken");

        if (await db.Players.AnyAsync(p => p.Username == req.Username, ct))
            return ServiceResult<RegisterResponse>.Fail("username_taken");

        if (!IsPasswordStrong(req.Password))
            return ServiceResult<RegisterResponse>.Fail("password_weak");

        var code = RandomNumberGenerator.GetInt32(100_000, 1_000_000).ToString("D6");

        var player = new Player
        {
            Id = Guid.NewGuid(),
            Username = req.Username,
            Email = req.Email,
            PasswordHash = passwordHasher.Hash(req.Password),
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

    public async Task<ServiceResult<LoginResponse>> LoginAsync(LoginRequest req, CancellationToken ct = default)
    {
        var player = await db.Players.FirstOrDefaultAsync(p => p.Email == req.Email, ct);

        if (player is null || !passwordHasher.Verify(req.Password, player.PasswordHash))
            return ServiceResult<LoginResponse>.Fail("invalid_credentials");

        if (!player.IsEmailConfirmed)
            return ServiceResult<LoginResponse>.Fail("email_not_confirmed");

        var token = tokenService.Generate(player);

        return ServiceResult<LoginResponse>.Ok(
            new LoginResponse(token, player.Id, player.Username, player.Email));
    }

    private static bool IsPasswordStrong(string password) =>
        password.Length >= 8 &&
        password.Any(char.IsUpper) &&
        password.Any(char.IsLower) &&
        password.Any(char.IsDigit);
}

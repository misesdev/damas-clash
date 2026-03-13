using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using api.Config;
using api.Models;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace api.Services;

public class JwtTokenService(IOptions<JwtSettings> opts) : ITokenService
{
    private readonly JwtSettings _settings = opts.Value;

    public TokenResult Generate(Player player)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_settings.Secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expiresAt = DateTimeOffset.UtcNow.AddMinutes(_settings.ExpiryMinutes);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, player.Id.ToString()),
            new("username", player.Username),
            new("role", player.Role.ToString()),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        if (player.Email is not null)
            claims.Add(new Claim(JwtRegisteredClaimNames.Email, player.Email));

        var token = new JwtSecurityToken(
            issuer: _settings.Issuer,
            audience: _settings.Audience,
            claims: claims,
            expires: expiresAt.UtcDateTime,
            signingCredentials: creds);

        return new TokenResult(new JwtSecurityTokenHandler().WriteToken(token), expiresAt);
    }

    public string GenerateRefreshToken()
    {
        var bytes = new byte[64];
        RandomNumberGenerator.Fill(bytes);
        return Convert.ToBase64String(bytes);
    }
}

using api.Models;

namespace api.Services;

public record TokenResult(string Token, DateTimeOffset ExpiresAt);

public interface ITokenService
{
    TokenResult Generate(Player player);
    string GenerateRefreshToken();
}

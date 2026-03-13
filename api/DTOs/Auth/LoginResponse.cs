namespace api.DTOs.Auth;

public record LoginResponse(
    string Token,
    string RefreshToken,
    DateTimeOffset ExpiresAt,
    Guid PlayerId,
    string Username,
    string? Email,
    string? AvatarUrl,
    string? NostrPubKey);

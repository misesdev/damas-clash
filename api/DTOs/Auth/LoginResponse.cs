namespace api.DTOs.Auth;

public record LoginResponse(string Token, Guid PlayerId, string Username, string Email, string? AvatarUrl);

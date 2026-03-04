namespace api.DTOs.Auth;

public record RegisterResponse(Guid Id, string Username, string Email, DateTimeOffset CreatedAt);

namespace api.DTOs.Players;

public record PlayerResponse(Guid Id, string Username, string? AvatarUrl, DateTimeOffset CreatedAt);

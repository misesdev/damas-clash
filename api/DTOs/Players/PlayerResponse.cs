namespace api.DTOs.Players;

public record PlayerResponse(Guid Id, string Username, string? AvatarUrl, string? LightningAddress, DateTimeOffset CreatedAt);

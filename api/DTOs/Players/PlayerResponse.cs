namespace api.DTOs.Players;

public record PlayerResponse(Guid Id, string Username, DateTimeOffset CreatedAt);

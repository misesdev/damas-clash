namespace api.DTOs.Games;

public record MoveResponse(Guid Id, Guid PlayerId, int FromRow, int FromCol, int ToRow, int ToCol, DateTimeOffset CreatedAt);

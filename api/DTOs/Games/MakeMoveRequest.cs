namespace api.DTOs.Games;

public record MakeMoveRequest(Guid PlayerId, int FromRow, int FromCol, int ToRow, int ToCol);

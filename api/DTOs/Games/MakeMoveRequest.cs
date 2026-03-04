namespace api.DTOs.Games;

public record MakeMoveRequest(int FromRow, int FromCol, int ToRow, int ToCol);

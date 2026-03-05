using api.Models.Enums;

namespace api.DTOs.Games;

public record GameResponse(
    Guid Id,
    Guid? PlayerBlackId,
    string? PlayerBlackUsername,
    Guid? PlayerWhiteId,
    string? PlayerWhiteUsername,
    Guid? WinnerId,
    GameStatus Status,
    string BoardState,
    PieceColor CurrentTurn,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt
);

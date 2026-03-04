using api.Models.Enums;

namespace api.DTOs.Games;

public record GameResponse(
    Guid Id,
    Guid? PlayerBlackId,
    Guid? PlayerWhiteId,
    GameStatus Status,
    string BoardState,
    PieceColor CurrentTurn,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt
);

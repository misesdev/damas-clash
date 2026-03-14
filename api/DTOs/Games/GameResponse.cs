using api.Models.Enums;

namespace api.DTOs.Games;

public record GameResponse(
    Guid Id,
    Guid? PlayerBlackId,
    string? PlayerBlackUsername,
    string? PlayerBlackAvatarUrl,
    Guid? PlayerWhiteId,
    string? PlayerWhiteUsername,
    string? PlayerWhiteAvatarUrl,
    Guid? WinnerId,
    Guid? ResignedByPlayerId,
    GameStatus Status,
    string BoardState,
    PieceColor CurrentTurn,
    long BetAmountSats,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt
);

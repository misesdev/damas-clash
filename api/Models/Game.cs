using api.Models.Enums;

namespace api.Models;

public class Game
{
    public Guid Id { get; set; }
    public Guid? PlayerBlackId { get; set; }
    public Guid? PlayerWhiteId { get; set; }
    public Guid? WinnerId { get; set; }
    public GameStatus Status { get; set; }
    public string BoardState { get; set; } = string.Empty;
    public PieceColor CurrentTurn { get; set; }
    public long BetAmountSats { get; set; }
    public bool BetSettled { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public Player? PlayerBlack { get; set; }
    public Player? PlayerWhite { get; set; }
    public ICollection<Move> Moves { get; set; } = [];
}

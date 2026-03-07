namespace api.Models;

public class Move
{
    public Guid Id { get; set; }
    public Guid GameId { get; set; }
    public Guid? PlayerId { get; set; }
    public int FromRow { get; set; }
    public int FromCol { get; set; }
    public int ToRow { get; set; }
    public int ToCol { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    public Game? Game { get; set; }
    public Player? Player { get; set; }
}

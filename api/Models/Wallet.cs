namespace api.Models;

public class Wallet
{
    public Guid Id { get; set; }
    public Guid PlayerId { get; set; }
    public long BalanceSats { get; set; }
    public long LockedBalanceSats { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public Player? Player { get; set; }

    public long AvailableBalanceSats => BalanceSats - LockedBalanceSats;
}

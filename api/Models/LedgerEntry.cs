using api.Models.Enums;

namespace api.Models;

public class LedgerEntry
{
    public Guid Id { get; set; }
    public Guid PlayerId { get; set; }
    public LedgerEntryType Type { get; set; }
    /// <summary>Always positive. Sign is determined by context/type.</summary>
    public long AmountSats { get; set; }
    public Guid? GameId { get; set; }
    public Guid? PaymentId { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    public Player? Player { get; set; }
    public Game? Game { get; set; }
    public LightningPayment? Payment { get; set; }
}

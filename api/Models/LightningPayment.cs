using api.Models.Enums;

namespace api.Models;

public class LightningPayment
{
    public Guid Id { get; set; }
    public Guid PlayerId { get; set; }
    public string PaymentHash { get; set; } = string.Empty;
    public string Invoice { get; set; } = string.Empty;
    public long AmountSats { get; set; }
    public PaymentStatus Status { get; set; }
    public PaymentDirection Direction { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public Player? Player { get; set; }
}

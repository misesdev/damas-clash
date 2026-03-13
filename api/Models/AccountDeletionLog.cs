namespace api.Models;

public class AccountDeletionLog
{
    public Guid Id { get; set; }
    public DateTimeOffset OccurredAt { get; set; } = DateTimeOffset.UtcNow;
}

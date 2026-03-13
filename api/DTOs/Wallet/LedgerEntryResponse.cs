namespace api.DTOs.Wallet;

public record LedgerEntryResponse(
    Guid Id,
    string Type,
    long AmountSats,
    Guid? GameId,
    Guid? PaymentId,
    DateTimeOffset CreatedAt
);

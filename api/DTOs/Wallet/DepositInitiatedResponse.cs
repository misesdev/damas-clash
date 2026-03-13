namespace api.DTOs.Wallet;

public record DepositInitiatedResponse(
    Guid PaymentId,
    string Invoice,
    string RHash,
    long ExpiresAt
);

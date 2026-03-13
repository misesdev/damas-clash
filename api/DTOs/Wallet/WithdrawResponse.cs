namespace api.DTOs.Wallet;

public record WithdrawResponse(
    string PaymentHash,
    long AmountSats,
    long FeePaidSats
);

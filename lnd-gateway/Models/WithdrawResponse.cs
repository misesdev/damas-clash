namespace lnd_gateway.Models;

public record WithdrawResponse(
    string PaymentHash,
    string PaymentPreimage,
    long FeePaidSats
);

namespace lnd_gateway.Models;

public record DepositResponse(
    string PaymentRequest,
    string RHash,
    long ExpiresAt
);

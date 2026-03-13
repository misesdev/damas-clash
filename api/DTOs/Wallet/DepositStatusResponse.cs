namespace api.DTOs.Wallet;

public record DepositStatusResponse(
    string Status,
    long AmountSats,
    bool Credited
);

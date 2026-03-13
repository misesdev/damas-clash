namespace api.DTOs.Wallet;

public record WalletResponse(
    long BalanceSats,
    long LockedBalanceSats,
    long AvailableBalanceSats
);

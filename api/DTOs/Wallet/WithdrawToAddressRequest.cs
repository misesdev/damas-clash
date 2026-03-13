using System.ComponentModel.DataAnnotations;

namespace api.DTOs.Wallet;

public record WithdrawToAddressRequest(
    [Range(1, long.MaxValue)] long AmountSats,
    [Range(0, long.MaxValue)] long MaxFeeSats = 10);

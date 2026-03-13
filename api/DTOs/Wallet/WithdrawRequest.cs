using System.ComponentModel.DataAnnotations;

namespace api.DTOs.Wallet;

public record WithdrawRequest(
    [Required] string Invoice,
    [Required, Range(1, long.MaxValue)] long AmountSats,
    long MaxFeeSats = 10
);

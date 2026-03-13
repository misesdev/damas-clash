using System.ComponentModel.DataAnnotations;

namespace api.DTOs.Wallet;

public record DepositRequest(
    [Required, Range(1, long.MaxValue)] long AmountSats,
    string? Memo = null
);

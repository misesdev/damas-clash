using System.ComponentModel.DataAnnotations;

namespace lnd_gateway.Models;

public record DepositRequest(
    [Required][Range(1, long.MaxValue, ErrorMessage = "AmountSats must be at least 1.")] long AmountSats,
    string? Memo
);

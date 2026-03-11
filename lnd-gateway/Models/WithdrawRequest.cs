using System.ComponentModel.DataAnnotations;

namespace lnd_gateway.Models;

public record WithdrawRequest(
    [Required] string PaymentRequest,
    long? MaxFeeSats
);

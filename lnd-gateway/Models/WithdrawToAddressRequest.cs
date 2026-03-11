using System.ComponentModel.DataAnnotations;

namespace lnd_gateway.Models;

public record WithdrawToAddressRequest(
    [Required] string LightningAddress,
    [Required][Range(1, long.MaxValue)] long AmountSats,
    long? MaxFeeSats
);

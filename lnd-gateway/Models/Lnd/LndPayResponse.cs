using System.Text.Json.Serialization;

namespace lnd_gateway.Models.Lnd;

public class LndPayResponse
{
    [JsonPropertyName("payment_error")]
    public string PaymentError { get; set; } = string.Empty;

    [JsonPropertyName("payment_preimage")]
    public string PaymentPreimage { get; set; } = string.Empty;

    [JsonPropertyName("payment_hash")]
    public string PaymentHash { get; set; } = string.Empty;

    [JsonPropertyName("payment_route")]
    public LndPaymentRoute? PaymentRoute { get; set; }
}

public class LndPaymentRoute
{
    [JsonPropertyName("total_fees")]
    public string TotalFees { get; set; } = "0";
}

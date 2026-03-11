using System.Text.Json.Serialization;

namespace lnd_gateway.Models.Lnd;

public class LndPayRequest
{
    [JsonPropertyName("payment_request")]
    public string PaymentRequest { get; set; } = string.Empty;

    [JsonPropertyName("fee_limit")]
    public LndFeeLimit? FeeLimit { get; set; }
}

public class LndFeeLimit
{
    [JsonPropertyName("fixed")]
    public string Fixed { get; set; } = "0";
}

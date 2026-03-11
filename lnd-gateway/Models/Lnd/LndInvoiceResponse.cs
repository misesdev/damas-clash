using System.Text.Json.Serialization;

namespace lnd_gateway.Models.Lnd;

public class LndInvoiceResponse
{
    [JsonPropertyName("r_hash")]
    public string RHash { get; set; } = string.Empty;

    [JsonPropertyName("payment_request")]
    public string PaymentRequest { get; set; } = string.Empty;

    [JsonPropertyName("add_index")]
    public string AddIndex { get; set; } = "0";
}

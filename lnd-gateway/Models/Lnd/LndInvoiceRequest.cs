using System.Text.Json.Serialization;

namespace lnd_gateway.Models.Lnd;

public class LndInvoiceRequest
{
    [JsonPropertyName("value")]
    public string Value { get; set; } = "0";

    [JsonPropertyName("memo")]
    public string Memo { get; set; } = string.Empty;

    [JsonPropertyName("expiry")]
    public string Expiry { get; set; } = "3600";
}

using System.Text.Json.Serialization;

namespace lnd_gateway.Models.Lnd;

public class LndGetInvoiceResponse
{
    [JsonPropertyName("r_hash")]
    public string RHash { get; set; } = string.Empty;

    [JsonPropertyName("value")]
    public string Value { get; set; } = "0";

    [JsonPropertyName("settled")]
    public bool Settled { get; set; }

    [JsonPropertyName("state")]
    public string State { get; set; } = "OPEN";

    [JsonPropertyName("amt_paid_sat")]
    public string AmtPaidSat { get; set; } = "0";

    [JsonPropertyName("memo")]
    public string Memo { get; set; } = string.Empty;
}

using System.Text.Json.Serialization;

namespace lnd_gateway.Models.Lnd;

public class LnurlCallbackResponse
{
    /// <summary>BOLT11 invoice para pagar.</summary>
    [JsonPropertyName("pr")]
    public string Pr { get; set; } = string.Empty;
}

using System.Text.Json.Serialization;

namespace lnd_gateway.Models.Lnd;

public class LnurlPayResponse
{
    [JsonPropertyName("callback")]
    public string Callback { get; set; } = string.Empty;

    /// <summary>Valor mínimo em millisatoshis.</summary>
    [JsonPropertyName("minSendable")]
    public long MinSendable { get; set; }

    /// <summary>Valor máximo em millisatoshis.</summary>
    [JsonPropertyName("maxSendable")]
    public long MaxSendable { get; set; }

    [JsonPropertyName("tag")]
    public string Tag { get; set; } = string.Empty;
}

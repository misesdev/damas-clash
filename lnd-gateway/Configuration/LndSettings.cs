namespace lnd_gateway.Configuration;

public class LndSettings
{
    public string RestUrl { get; set; } = string.Empty;
    public string Macaroon { get; set; } = string.Empty;
    public string TlsCertPath { get; set; } = "tls.cert";
}

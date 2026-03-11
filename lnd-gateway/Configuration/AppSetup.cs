using Microsoft.Extensions.Options;
using Microsoft.OpenApi;
using System.Security.Cryptography.X509Certificates;
using lnd_gateway.Services;

namespace lnd_gateway.Configuration;

public static class AppSetup
{
  public static void UseAppSetup(this WebApplicationBuilder builder)
  {
    // In Development, load .env from the solution root (one level above api/)
    if (builder.Environment.IsDevelopment())
    {
      var envFile = Path.Combine(Directory.GetCurrentDirectory(), "..", ".env");
      if (File.Exists(envFile))
      {
        foreach (var line in File.ReadAllLines(envFile))
        {
          var trimmed = line.Trim();
          if (trimmed.Length == 0 || trimmed.StartsWith('#')) continue;
          var eq = trimmed.IndexOf('=');
          if (eq < 0) continue;
          var key = trimmed[..eq].Trim();
          var value = trimmed[(eq + 1)..].Trim();
          // Strip surrounding quotes: KEY="value" or KEY='value'
          if (value.Length >= 2 &&
              ((value[0] == '"'  && value[^1] == '"') ||
               (value[0] == '\'' && value[^1] == '\'')))
            value = value[1..^1];
          Environment.SetEnvironmentVariable(key, value);
        }
      }
    }

    // Map env vars (LND_REST_URL, LND_MACAROON, GATEWAY_API_KEY) into config sections
    builder.Configuration.AddInMemoryCollection(new Dictionary<string, string?>
        {
        ["Lnd:RestUrl"]    = Environment.GetEnvironmentVariable("LND_REST_URL"),
        ["Lnd:Macaroon"]   = Environment.GetEnvironmentVariable("LND_MACAROON"),
        ["Gateway:ApiKey"] = Environment.GetEnvironmentVariable("GATEWAY_API_KEY"),
        });

    builder.Services.Configure<LndSettings>(builder.Configuration.GetSection("Lnd"));
    builder.Services.Configure<GatewaySettings>(builder.Configuration.GetSection("Gateway"));

    builder.Services.AddSwaggerGen(options =>
    {
      options.SwaggerDoc("v1", new OpenApiInfo
      {
        Title = "LND Gateway API",
        Version = "v1",
        Description = "Lightning Network payment gateway — cria invoices (deposit) e paga invoices (withdraw) via LND REST API."
      });

      options.AddSecurityDefinition("ApiKey", new OpenApiSecurityScheme
      {
        Type = SecuritySchemeType.ApiKey,
        In = ParameterLocation.Header,
        Name = "X-Api-Key",
        Description = "Chave de autenticação obrigatória para os endpoints de carteira."
      });

      options.AddSecurityRequirement(_ => new OpenApiSecurityRequirement
      {
        {
          new OpenApiSecuritySchemeReference("ApiKey"),
          new List<string>()
        }
      });
    });

    // HttpClient para LNURL-pay (chamadas externas HTTPS padrão, sem TLS customizado)
    builder.Services.AddHttpClient<ILightningAddressService, LightningAddressService>();

    // Typed HttpClient for LND REST API with TLS cert pinning and macaroon auth
    builder.Services.AddHttpClient<ILndService, LndService>((sp, client) => {
      var settings = sp.GetRequiredService<IOptions<LndSettings>>().Value;
      client.BaseAddress = new Uri(settings.RestUrl);
      client.DefaultRequestHeaders.Add("Grpc-Metadata-Macaroon", settings.Macaroon);
    }).ConfigurePrimaryHttpMessageHandler(sp => {
      var handler = new HttpClientHandler();
      var settings = sp.GetRequiredService<IOptions<LndSettings>>().Value;
      if (File.Exists(settings.TlsCertPath))
      {
        var cert = X509CertificateLoader.LoadCertificateFromFile(settings.TlsCertPath);
        handler.ServerCertificateCustomValidationCallback = (_, serverCert, _, _) =>
        serverCert?.Thumbprint == cert.Thumbprint;
      }
      return handler;
    });
  }
}

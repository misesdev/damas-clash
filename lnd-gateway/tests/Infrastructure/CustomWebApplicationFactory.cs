using lnd_gateway.Configuration;
using lnd_gateway.Services;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace tests.Infrastructure;

public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    public const string TestApiKey = "test-api-key-for-integration-tests";

    public FakeLndService FakeLndService { get; } = new();
    public FakeLightningAddressService FakeLightningAddressService { get; } = new();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureServices(services =>
        {
            services.RemoveAll<ILndService>();
            services.AddSingleton<ILndService>(FakeLndService);

            services.RemoveAll<ILightningAddressService>();
            services.AddSingleton<ILightningAddressService>(FakeLightningAddressService);

            // Override settings for tests
            services.Configure<GatewaySettings>(o => o.ApiKey = TestApiKey);
            services.Configure<LndSettings>(o =>
            {
                o.RestUrl = "https://localhost:10009";
                o.Macaroon = "test-macaroon";
                o.TlsCertPath = "nonexistent.cert";
            });
        });
    }
}

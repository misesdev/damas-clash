using api.Data;
using api.Services;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace api.tests.Infrastructure;

public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    public FakeEmailService EmailService { get; } = new();
    public FakeLightningGatewayService LightningGateway { get; } = new();
    public FakeLightningAddressValidator LightningAddressValidator { get; } = new();
    public FakeNotificationService NotificationService { get; } = new();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureAppConfiguration((_, cfg) =>
            cfg.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Secret"] = "test-secret-must-be-at-least-32-characters-long!",
                ["Jwt:Issuer"] = "test",
                ["Jwt:Audience"] = "test",
                ["BCrypt:WorkFactor"] = "4"
            }));

        builder.ConfigureServices(services =>
        {
            // Remove all descriptors related to DamasDbContext (including IDbContextOptionsConfiguration<DamasDbContext>)
            var toRemove = services
                .Where(d =>
                    d.ServiceType == typeof(DbContextOptions<DamasDbContext>) ||
                    (d.ServiceType.IsGenericType &&
                     d.ServiceType.GetGenericArguments().Contains(typeof(DamasDbContext))))
                .ToList();

            foreach (var d in toRemove)
                services.Remove(d);

            var dbName = "TestDb_" + Guid.NewGuid();
            services.AddDbContext<DamasDbContext>(options =>
                options.UseInMemoryDatabase(dbName)
                       .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning)));

            services.RemoveAll<IDistributedCache>();
            services.AddDistributedMemoryCache();

            services.RemoveAll<IEmailService>();
            services.AddSingleton<IEmailService>(EmailService);

            services.RemoveAll<ILightningGatewayService>();
            services.AddSingleton<ILightningGatewayService>(LightningGateway);

            services.RemoveAll<ILightningAddressValidator>();
            services.AddSingleton<ILightningAddressValidator>(LightningAddressValidator);

            services.RemoveAll<INotificationService>();
            services.AddSingleton<INotificationService>(NotificationService);
        });
    }
}

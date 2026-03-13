using api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace api.Config;

public static class AppSettings 
{
    public static void UseAppSettings(this WebApplicationBuilder builder) 
    {
        var redisConfig = builder.Configuration["Redis:Configuration"];
        if (!string.IsNullOrEmpty(redisConfig))
            builder.Services.AddStackExchangeRedisCache(options => options.Configuration = redisConfig);
        else
            builder.Services.AddDistributedMemoryCache();
        builder.Services.AddScoped<IGameCacheService, GameCacheService>();
        builder.Services.AddSingleton<IGameWatcherService, GameWatcherService>();
        builder.Services.AddSingleton<IOnlinePlayerTracker, OnlinePlayerTracker>();
        builder.Services.AddSingleton<IChallengeService, ChallengeService>();
        builder.Services.AddSingleton<INostrChallengeStore, NostrChallengeStore>();

        builder.Services.AddHttpClient<ILightningAddressValidator, LightningAddressValidator>();
        builder.Services.AddScoped<IPlayerService, PlayerService>();
        builder.Services.AddScoped<IGameService, GameService>();
        builder.Services.AddScoped<IEmailService, SendGridEmailService>();
        builder.Services.AddScoped<ITokenService, JwtTokenService>();
        builder.Services.AddScoped<IAuthService, AuthService>();
        builder.Services.AddScoped<ICloudinaryService, CloudinaryService>();

        // Financial services
        builder.Services.AddScoped<IWalletService, WalletService>();
        builder.Services.AddScoped<ILightningService, LightningService>();
        builder.Services.AddScoped<ISettlementService, SettlementService>();

        // Lightning Gateway HTTP client

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
                    Environment.SetEnvironmentVariable(key, value);
                }
            }
        }

        // Map flat env var names to the nested config keys used by appsettings.json
        var jwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET");
        if (!string.IsNullOrEmpty(jwtSecret))
            builder.Configuration["Jwt:Secret"] = jwtSecret;

        var sendGridKey = Environment.GetEnvironmentVariable("SENDGRID_API_KEY");
        if (!string.IsNullOrEmpty(sendGridKey))
            builder.Configuration["SendGrid:ApiKey"] = sendGridKey;

        var cloudinaryCloudName = Environment.GetEnvironmentVariable("CLOUDINARY_CLOUD_NAME");
        if (!string.IsNullOrEmpty(cloudinaryCloudName))
            builder.Configuration["Cloudinary:CloudName"] = cloudinaryCloudName;

        var cloudinaryApiKey = Environment.GetEnvironmentVariable("CLOUDINARY_API_KEY");
        if (!string.IsNullOrEmpty(cloudinaryApiKey))
            builder.Configuration["Cloudinary:ApiKey"] = cloudinaryApiKey;

        var cloudinaryApiSecret = Environment.GetEnvironmentVariable("CLOUDINARY_API_SECRET");
        if (!string.IsNullOrEmpty(cloudinaryApiSecret))
            builder.Configuration["Cloudinary:ApiSecret"] = cloudinaryApiSecret;

        builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("Jwt"));
        builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer();

        var gatewayToken = Environment.GetEnvironmentVariable("GATEWAY_API_KEY");
        if (!string.IsNullOrEmpty(gatewayToken))
          builder.Configuration["LightningGateway:ApiKey"] = gatewayToken;

        builder.Services.Configure<LightningGatewaySettings>(builder.Configuration
            .GetSection("LightningGateway"));

        builder.Services.AddHttpClient<ILightningGatewayService, LightningGatewayService>((sp, client) =>
        {
            var settings = sp.GetRequiredService<IOptions<LightningGatewaySettings>>().Value;
            client.BaseAddress = new Uri(settings.BaseUrl);
            client.DefaultRequestHeaders.Add("X-Api-Key", settings.ApiKey);
        });

        builder.Services.AddOptions<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme)
            .Configure<IOptions<JwtSettings>>((options, settings) =>
            {
                var key = Encoding.UTF8.GetBytes(settings.Value.Secret);
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = false,
                    ValidateAudience = false,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(key)
                };
                options.Events = new JwtBearerEvents
                {
                    OnMessageReceived = context =>
                    {
                        var token = context.Request.Query["access_token"];
                        if (!string.IsNullOrEmpty(token) &&
                            context.HttpContext.Request.Path.StartsWithSegments("/hubs"))
                            context.Token = token;
                        return Task.CompletedTask;
                    }
                };
            });
    }
}

using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;

namespace api.Config;

public static class RateLimitConfig
{
    public const string EmailVerification = "email-verification";
    public const string NostrLogin = "nostr-login";

    /// <summary>
    /// Registers per-IP rate limiting policies for sensitive auth endpoints.
    /// Skipped in the "Testing" environment so integration tests are not affected.
    /// </summary>
    public static void UseRateLimiting(this WebApplicationBuilder builder)
    {
        if (builder.Environment.IsEnvironment("Testing"))
            return;

        builder.Services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

            // OTP code verification: max 10 attempts per 15 min per IP.
            // Protects confirm-email and verify-login against brute-force.
            options.AddPolicy(EmailVerification, context =>
            {
                var ip = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
                return RateLimitPartition.GetFixedWindowLimiter(
                    partitionKey: $"{EmailVerification}:{ip}",
                    factory: _ => new FixedWindowRateLimiterOptions
                    {
                        Window = TimeSpan.FromMinutes(15),
                        PermitLimit = 10,
                        QueueLimit = 0,
                        AutoReplenishment = true,
                    });
            });

            // Nostr login: max 20 attempts per minute per IP.
            // Signature verification is cheap to attempt — limit replay attacks.
            options.AddPolicy(NostrLogin, context =>
            {
                var ip = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
                return RateLimitPartition.GetFixedWindowLimiter(
                    partitionKey: $"{NostrLogin}:{ip}",
                    factory: _ => new FixedWindowRateLimiterOptions
                    {
                        Window = TimeSpan.FromMinutes(1),
                        PermitLimit = 10,
                        QueueLimit = 0,
                        AutoReplenishment = true,
                    });
            });
        });
    }
}

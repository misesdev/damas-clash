using System.Net;
using System.Net.Http.Json;
using api.DTOs.Auth;
using api.tests.Infrastructure;
using Microsoft.AspNetCore.Hosting;

namespace api.tests.Controllers;

/// <summary>
/// Uses a dedicated factory running in "Development" so that rate limiting
/// middleware is active. Separate from AuthControllerTests to avoid shared
/// IP counter contamination.
/// </summary>
public class RateLimitWebAppFactory : CustomWebApplicationFactory
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        base.ConfigureWebHost(builder);
        // Override the "Testing" env set by the base factory to enable rate limiting.
        builder.UseEnvironment("Development");
    }
}

public class RateLimitTests(RateLimitWebAppFactory factory)
    : IClassFixture<RateLimitWebAppFactory>
{
    private readonly HttpClient _client = factory.CreateClient();
    private readonly FakeEmailService _email = factory.EmailService;

    // ── Email Verification (confirm-email) ─────────────────────────────────

    [Fact]
    public async Task ConfirmEmail_ExceedsRateLimit_Returns429()
    {
        // Exhaust the 10-attempt window with invalid codes.
        for (int i = 0; i < 10; i++)
            await _client.PostAsJsonAsync("/api/auth/confirm-email",
                new ConfirmEmailRequest($"flood{i}@test.com", "000000"));

        // The 11th request from the same IP must be rejected.
        var response = await _client.PostAsJsonAsync("/api/auth/confirm-email",
            new ConfirmEmailRequest("flood10@test.com", "000000"));

        Assert.Equal(HttpStatusCode.TooManyRequests, response.StatusCode);
    }

    // ── Email Verification (verify-login) ──────────────────────────────────

    [Fact]
    public async Task VerifyLogin_ExceedsRateLimit_Returns429()
    {
        // confirm-email and verify-login share the same policy bucket.
        // Use 10 verify-login attempts to exhaust the window.
        for (int i = 0; i < 10; i++)
            await _client.PostAsJsonAsync("/api/auth/verify-login",
                new VerifyLoginRequest($"vflood{i}@test.com", "000000"));

        var response = await _client.PostAsJsonAsync("/api/auth/verify-login",
            new VerifyLoginRequest("vflood10@test.com", "000000"));

        Assert.Equal(HttpStatusCode.TooManyRequests, response.StatusCode);
    }

    // ── Nostr Login ────────────────────────────────────────────────────────

    [Fact]
    public async Task NostrLogin_ExceedsRateLimit_Returns429()
    {
        // Exhaust the 20-attempt-per-minute window with invalid requests.
        for (int i = 0; i < 20; i++)
            await _client.PostAsJsonAsync("/api/auth/nostr/login-event",
                new { kind = 0, pubkey = "bad", id = "bad", sig = "bad", tags = Array.Empty<string[]>(), content = "", created_at = 0 });

        var response = await _client.PostAsJsonAsync("/api/auth/nostr/login-event",
            new { kind = 0, pubkey = "bad", id = "bad", sig = "bad", tags = Array.Empty<string[]>(), content = "", created_at = 0 });

        Assert.Equal(HttpStatusCode.TooManyRequests, response.StatusCode);
    }
}

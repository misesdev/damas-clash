using lnd_gateway.Configuration;
using Microsoft.Extensions.Options;

namespace lnd_gateway.Middleware;

public class ApiKeyMiddleware
{
    private const string ApiKeyHeader = "X-Api-Key";

    private readonly RequestDelegate _next;
    private readonly string _apiKey;

    public ApiKeyMiddleware(RequestDelegate next, IOptions<GatewaySettings> settings)
    {
        _next = next;
        _apiKey = settings.Value.ApiKey;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (context.Request.Path.StartsWithSegments("/api/health"))
        {
            await _next(context);
            return;
        }

        if (!context.Request.Headers.TryGetValue(ApiKeyHeader, out var providedKey) || providedKey != _apiKey)
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            await context.Response.WriteAsJsonAsync(new { error = "Unauthorized: valid X-Api-Key header required." });
            return;
        }

        await _next(context);
    }
}

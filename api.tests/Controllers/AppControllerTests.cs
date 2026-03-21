using System.Net;
using System.Text.Json;
using api.tests.Infrastructure;

namespace api.tests.Controllers;

public class AppControllerTests(CustomWebApplicationFactory factory)
    : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task GetVersion_Returns200_WithMinVersion()
    {
        var response = await _client.GetAsync("/api/app/version");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadAsStringAsync();
        var json = JsonDocument.Parse(body);
        Assert.True(json.RootElement.TryGetProperty("minVersion", out var prop));
        Assert.False(string.IsNullOrEmpty(prop.GetString()));
    }

    [Fact]
    public async Task GetVersion_IsPublic_NoAuthRequired()
    {
        // Call without any Authorization header — should still return 200
        var response = await _client.GetAsync("/api/app/version");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}

using System.Net;
using System.Text.Json;
using api.tests.Infrastructure;

namespace api.tests.Controllers;

public class HealthControllerTests(CustomWebApplicationFactory factory)
    : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task GetHealth_Returns200WithStatusOk()
    {
        var response = await _client.GetAsync("/api/health");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadAsStringAsync();
        var json = JsonDocument.Parse(body);
        Assert.Equal("ok", json.RootElement.GetProperty("status").GetString());
    }

    [Fact]
    public async Task GetHealthDb_Returns200WithDatabaseOk()
    {
        var response = await _client.GetAsync("/api/health/db");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadAsStringAsync();
        var json = JsonDocument.Parse(body);
        Assert.Equal("ok", json.RootElement.GetProperty("status").GetString());
        Assert.Equal("postgres", json.RootElement.GetProperty("database").GetString());
    }
}

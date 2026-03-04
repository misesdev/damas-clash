using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using api.DTOs.Auth;
using api.DTOs.Players;
using api.tests.Infrastructure;

namespace api.tests.Controllers;

public class PlayersControllerTests(CustomWebApplicationFactory factory)
    : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client = factory.CreateClient();
    private readonly FakeEmailService _email = factory.EmailService;

    private static readonly JsonSerializerOptions JsonOpts =
        new(JsonSerializerDefaults.Web);

    [Fact]
    public async Task GetAll_ReturnsEmptyList()
    {
        var response = await _client.GetAsync("/api/players");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var players = await response.Content.ReadFromJsonAsync<List<PlayerResponse>>(JsonOpts);
        Assert.NotNull(players);
    }

    [Fact]
    public async Task Register_Returns201WithPlayer()
    {
        var req = new RegisterRequest("reg_test201", "reg_test201@test.com", "Password1");

        var response = await _client.PostAsJsonAsync("/api/auth/register", req);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var player = await response.Content.ReadFromJsonAsync<RegisterResponse>(JsonOpts);
        Assert.NotNull(player);
        Assert.Equal("reg_test201", player.Username);
        Assert.NotEqual(Guid.Empty, player.Id);
    }

    [Fact]
    public async Task GetById_ExistingPlayer_Returns200()
    {
        var created = await RegisterAndConfirm("getbyid_plr");

        var response = await _client.GetAsync($"/api/players/{created}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var player = await response.Content.ReadFromJsonAsync<PlayerResponse>(JsonOpts);
        Assert.NotNull(player);
        Assert.Equal(created, player.Id);
    }

    [Fact]
    public async Task GetById_UnknownPlayer_Returns404()
    {
        var response = await _client.GetAsync($"/api/players/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    private async Task<Guid> RegisterAndConfirm(string suffix)
    {
        var req = new RegisterRequest($"usr_{suffix}", $"{suffix}@test.com", "Password1");
        var regResp = await _client.PostAsJsonAsync("/api/auth/register", req);
        regResp.EnsureSuccessStatusCode();
        var body = (await regResp.Content.ReadFromJsonAsync<RegisterResponse>(JsonOpts))!;

        var code = _email.GetCode(req.Email)!;
        await _client.PostAsJsonAsync("/api/auth/confirm-email", new ConfirmEmailRequest(req.Email, code));

        return body.Id;
    }
}

using System.Net;
using System.Net.Http.Headers;
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
    public async Task GetAll_Authenticated_Returns200()
    {
        var (_, token) = await RegisterAndConfirm("getall_plr");

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var response = await _client.GetAsync("/api/players");
        _client.DefaultRequestHeaders.Authorization = null;

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var players = await response.Content.ReadFromJsonAsync<List<PlayerResponse>>(JsonOpts);
        Assert.NotNull(players);
    }

    [Fact]
    public async Task GetAll_Unauthenticated_Returns401()
    {
        var response = await _client.GetAsync("/api/players");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Register_Returns201WithPlayer()
    {
        var req = new RegisterRequest("reg_test201", "reg_test201@test.com");

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
        var (id, token) = await RegisterAndConfirm("getbyid_plr");

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var response = await _client.GetAsync($"/api/players/{id}");
        _client.DefaultRequestHeaders.Authorization = null;

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var player = await response.Content.ReadFromJsonAsync<PlayerResponse>(JsonOpts);
        Assert.NotNull(player);
        Assert.Equal(id, player.Id);
    }

    [Fact]
    public async Task GetById_Unauthenticated_Returns401()
    {
        var response = await _client.GetAsync($"/api/players/{Guid.NewGuid()}");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetById_UnknownPlayer_Returns404()
    {
        var (_, token) = await RegisterAndConfirm("getbyid_404");

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var response = await _client.GetAsync($"/api/players/{Guid.NewGuid()}");
        _client.DefaultRequestHeaders.Authorization = null;

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    private async Task<(Guid id, string token)> RegisterAndConfirm(string suffix)
    {
        var req = new RegisterRequest($"usr_{suffix}", $"{suffix}@test.com");
        var regResp = await _client.PostAsJsonAsync("/api/auth/register", req);
        regResp.EnsureSuccessStatusCode();
        var regBody = (await regResp.Content.ReadFromJsonAsync<RegisterResponse>(JsonOpts))!;

        var code = _email.GetCode(req.Email)!;
        var confirmResp = await _client.PostAsJsonAsync("/api/auth/confirm-email",
            new ConfirmEmailRequest(req.Email, code));
        var loginBody = (await confirmResp.Content.ReadFromJsonAsync<LoginResponse>(JsonOpts))!;

        return (regBody.Id, loginBody.Token);
    }
}

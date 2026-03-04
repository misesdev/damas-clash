using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using api.DTOs.Auth;
using api.DTOs.Games;
using api.tests.Infrastructure;

namespace api.tests.Controllers;

public class GamesControllerTests(CustomWebApplicationFactory factory)
    : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client = factory.CreateClient();
    private readonly FakeEmailService _email = factory.EmailService;

    private static readonly JsonSerializerOptions JsonOpts =
        new(JsonSerializerDefaults.Web);

    [Fact]
    public async Task GetActive_ReturnsEmptyList()
    {
        var response = await _client.GetAsync("/api/games");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var games = await response.Content.ReadFromJsonAsync<List<GameResponse>>(JsonOpts);
        Assert.NotNull(games);
    }

    [Fact]
    public async Task Create_Returns201WithGame()
    {
        var playerId = await CreatePlayer("game_creator");

        var response = await _client.PostAsJsonAsync("/api/games", new CreateGameRequest(playerId));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var game = await response.Content.ReadFromJsonAsync<GameResponse>(JsonOpts);
        Assert.NotNull(game);
        Assert.Equal(playerId, game.PlayerBlackId);
        Assert.NotEqual(Guid.Empty, game.Id);
    }

    [Fact]
    public async Task GetById_ExistingGame_Returns200()
    {
        var playerId = await CreatePlayer("game_getbyid");
        var created = await CreateGame(playerId);

        var response = await _client.GetAsync($"/api/games/{created.Id}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var game = await response.Content.ReadFromJsonAsync<GameResponse>(JsonOpts);
        Assert.NotNull(game);
        Assert.Equal(created.Id, game.Id);
    }

    [Fact]
    public async Task GetById_UnknownGame_Returns404()
    {
        var response = await _client.GetAsync($"/api/games/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Join_ExistingGame_Returns200()
    {
        var black = await CreatePlayer("join_black");
        var white = await CreatePlayer("join_white");
        var game = await CreateGame(black);

        var response = await _client.PostAsJsonAsync(
            $"/api/games/{game.Id}/join", new JoinGameRequest(white));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var updated = await response.Content.ReadFromJsonAsync<GameResponse>(JsonOpts);
        Assert.NotNull(updated);
        Assert.Equal(white, updated.PlayerWhiteId);
    }

    [Fact]
    public async Task MakeMove_Returns200()
    {
        var black = await CreatePlayer("move_black");
        var white = await CreatePlayer("move_white");
        var game = await CreateGame(black);
        await JoinGame(game.Id, white);

        var response = await _client.PostAsJsonAsync(
            $"/api/games/{game.Id}/moves",
            new MakeMoveRequest(black, 5, 0, 4, 1));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    private async Task<Guid> CreatePlayer(string suffix)
    {
        var req = new RegisterRequest($"gm_{suffix}", $"gm_{suffix}@test.com", "Password1");
        var regResp = await _client.PostAsJsonAsync("/api/auth/register", req);
        regResp.EnsureSuccessStatusCode();
        var body = (await regResp.Content.ReadFromJsonAsync<RegisterResponse>(JsonOpts))!;

        var code = _email.GetCode(req.Email)!;
        await _client.PostAsJsonAsync("/api/auth/confirm-email", new ConfirmEmailRequest(req.Email, code));

        return body.Id;
    }

    private async Task<GameResponse> CreateGame(Guid playerId)
    {
        var response = await _client.PostAsJsonAsync("/api/games", new CreateGameRequest(playerId));
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<GameResponse>(JsonOpts))!;
    }

    private async Task JoinGame(Guid gameId, Guid playerId)
    {
        var response = await _client.PostAsJsonAsync($"/api/games/{gameId}/join", new JoinGameRequest(playerId));
        response.EnsureSuccessStatusCode();
    }
}

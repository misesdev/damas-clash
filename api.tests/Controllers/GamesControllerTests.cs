using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using api.Data;
using api.DTOs.Auth;
using api.DTOs.Games;
using api.Engine;
using api.Models.Enums;
using api.Services;
using api.tests.Infrastructure;
using Microsoft.Extensions.DependencyInjection;

namespace api.tests.Controllers;

public class GamesControllerTests(CustomWebApplicationFactory factory)
    : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client = factory.CreateClient();
    private readonly FakeEmailService _email = factory.EmailService;
    private IGameCacheService GetCache() =>
        factory.Services.CreateScope().ServiceProvider.GetRequiredService<IGameCacheService>();

    private static readonly JsonSerializerOptions JsonOpts =
        new(JsonSerializerDefaults.Web);

    // ── GET /api/games ──────────────────────────────────────────────────────────

    [Fact]
    public async Task GetActive_ReturnsEmptyList()
    {
        var response = await _client.GetAsync("/api/games");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var games = await response.Content.ReadFromJsonAsync<List<GameResponse>>(JsonOpts);
        Assert.NotNull(games);
    }

    // ── POST /api/games ─────────────────────────────────────────────────────────

    [Fact]
    public async Task Create_Returns201WithGame()
    {
        var (playerId, token) = await CreatePlayer("game_creator");

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var response = await _client.PostAsync("/api/games", null);
        _client.DefaultRequestHeaders.Authorization = null;

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var game = await response.Content.ReadFromJsonAsync<GameResponse>(JsonOpts);
        Assert.NotNull(game);
        Assert.Equal(playerId, game.PlayerBlackId);
        Assert.NotEqual(Guid.Empty, game.Id);
    }

    [Fact]
    public async Task Create_InitialBoardStateIsNotEmpty()
    {
        var (_, token) = await CreatePlayer("game_boardstate");

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var response = await _client.PostAsync("/api/games", null);
        _client.DefaultRequestHeaders.Authorization = null;

        var game = await response.Content.ReadFromJsonAsync<GameResponse>(JsonOpts);
        Assert.NotNull(game);
        Assert.NotEmpty(game.BoardState);
        Assert.NotEqual("{}", game.BoardState);
    }

    [Fact]
    public async Task Create_Unauthorized_Returns401()
    {
        var response = await _client.PostAsync("/api/games", null);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ── GET /api/games/{id} ─────────────────────────────────────────────────────

    [Fact]
    public async Task GetById_ExistingGame_Returns200()
    {
        var (_, token) = await CreatePlayer("game_getbyid");
        var created = await CreateGame(token);

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

    // ── POST /api/games/{id}/join ───────────────────────────────────────────────

    [Fact]
    public async Task Join_ExistingGame_Returns200WithWhitePlayer()
    {
        var (_, blackToken) = await CreatePlayer("join_black");
        var (whiteId, whiteToken) = await CreatePlayer("join_white");
        var game = await CreateGame(blackToken);

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", whiteToken);
        var response = await _client.PostAsync($"/api/games/{game.Id}/join", null);
        _client.DefaultRequestHeaders.Authorization = null;

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var updated = await response.Content.ReadFromJsonAsync<GameResponse>(JsonOpts);
        Assert.NotNull(updated);
        Assert.Equal(whiteId, updated.PlayerWhiteId);
    }

    [Fact]
    public async Task Join_SamePlayerTwice_Returns400()
    {
        var (_, blackToken) = await CreatePlayer("join_dup");
        var game = await CreateGame(blackToken);

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", blackToken);
        var response = await _client.PostAsync($"/api/games/{game.Id}/join", null);
        _client.DefaultRequestHeaders.Authorization = null;

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Join_GameAlreadyInProgress_Returns400()
    {
        var (_, blackToken) = await CreatePlayer("join_inprog_b");
        var (_, whiteToken) = await CreatePlayer("join_inprog_w");
        var (_, thirdToken) = await CreatePlayer("join_inprog_x");
        var game = await CreateGame(blackToken);
        await JoinGame(game.Id, whiteToken); // game now InProgress

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", thirdToken);
        var response = await _client.PostAsync($"/api/games/{game.Id}/join", null);
        _client.DefaultRequestHeaders.Authorization = null;

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Join_UnknownGame_Returns404()
    {
        var (_, token) = await CreatePlayer("join_notfound");

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var response = await _client.PostAsync($"/api/games/{Guid.NewGuid()}/join", null);
        _client.DefaultRequestHeaders.Authorization = null;

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    // ── POST /api/games/{id}/moves ──────────────────────────────────────────────

    [Fact]
    public async Task MakeMove_ValidBlackFirstMove_Returns200()
    {
        var (_, blackToken) = await CreatePlayer("move_b1");
        var (_, whiteToken) = await CreatePlayer("move_w1");
        var game = await CreateGame(blackToken);
        await JoinGame(game.Id, whiteToken);

        // Black piece at (2,1) moves forward to (3,0)
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", blackToken);
        var response = await _client.PostAsJsonAsync(
            $"/api/games/{game.Id}/moves",
            new MakeMoveRequest(2, 1, 3, 0));
        _client.DefaultRequestHeaders.Authorization = null;

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var updated = await response.Content.ReadFromJsonAsync<GameResponse>(JsonOpts);
        Assert.NotNull(updated);
    }

    [Fact]
    public async Task MakeMove_TurnChangesAfterValidMove()
    {
        var (_, blackToken) = await CreatePlayer("move_turn_b");
        var (_, whiteToken) = await CreatePlayer("move_turn_w");
        var game = await CreateGame(blackToken);
        await JoinGame(game.Id, whiteToken);

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", blackToken);
        var response = await _client.PostAsJsonAsync(
            $"/api/games/{game.Id}/moves",
            new MakeMoveRequest(2, 1, 3, 0));
        _client.DefaultRequestHeaders.Authorization = null;

        var updated = await response.Content.ReadFromJsonAsync<GameResponse>(JsonOpts);
        Assert.NotNull(updated);
        Assert.Equal(api.Models.Enums.PieceColor.White, updated.CurrentTurn);
    }

    [Fact]
    public async Task MakeMove_InvalidDestination_Returns400()
    {
        var (_, blackToken) = await CreatePlayer("move_invalid_b");
        var (_, whiteToken) = await CreatePlayer("move_invalid_w");
        var game = await CreateGame(blackToken);
        await JoinGame(game.Id, whiteToken);

        // Black piece at (2,1) tries to move backward to (1,0) — invalid for a man
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", blackToken);
        var response = await _client.PostAsJsonAsync(
            $"/api/games/{game.Id}/moves",
            new MakeMoveRequest(2, 1, 1, 0));
        _client.DefaultRequestHeaders.Authorization = null;

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task MakeMove_WrongTurn_Returns400()
    {
        var (_, blackToken) = await CreatePlayer("move_wt_b");
        var (_, whiteToken) = await CreatePlayer("move_wt_w");
        var game = await CreateGame(blackToken);
        await JoinGame(game.Id, whiteToken);

        // White tries to move on Black's turn
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", whiteToken);
        var response = await _client.PostAsJsonAsync(
            $"/api/games/{game.Id}/moves",
            new MakeMoveRequest(5, 0, 4, 1));
        _client.DefaultRequestHeaders.Authorization = null;

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task MakeMove_NotPlayerInGame_Returns400()
    {
        var (_, blackToken) = await CreatePlayer("move_np_b");
        var (_, whiteToken) = await CreatePlayer("move_np_w");
        var (_, outsiderToken) = await CreatePlayer("move_np_x");
        var game = await CreateGame(blackToken);
        await JoinGame(game.Id, whiteToken);

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", outsiderToken);
        var response = await _client.PostAsJsonAsync(
            $"/api/games/{game.Id}/moves",
            new MakeMoveRequest(2, 1, 3, 0));
        _client.DefaultRequestHeaders.Authorization = null;

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task MakeMove_GameNotStarted_Returns400()
    {
        var (_, blackToken) = await CreatePlayer("move_ns_b");
        var game = await CreateGame(blackToken);

        // Game is still WaitingForPlayers
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", blackToken);
        var response = await _client.PostAsJsonAsync(
            $"/api/games/{game.Id}/moves",
            new MakeMoveRequest(2, 1, 3, 0));
        _client.DefaultRequestHeaders.Authorization = null;

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task MakeMove_UnknownGame_Returns404()
    {
        var (_, token) = await CreatePlayer("move_unk");

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var response = await _client.PostAsJsonAsync(
            $"/api/games/{Guid.NewGuid()}/moves",
            new MakeMoveRequest(2, 1, 3, 0));
        _client.DefaultRequestHeaders.Authorization = null;

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task MakeMove_MandatoryCapture_CannotMakeSimpleMove()
    {
        var (_, blackToken) = await CreatePlayer("move_cap_b");
        var (_, whiteToken) = await CreatePlayer("move_cap_w");
        var game = await CreateGame(blackToken);
        await JoinGame(game.Id, whiteToken);

        // Set up a board where black has a capture available:
        // Move black (2,1)→(3,2), then white (5,4)→(4,3), giving black capture at (3,2)→(5,4)
        await MakeMove(game.Id, blackToken, 2, 1, 3, 2);
        await MakeMove(game.Id, whiteToken, 5, 4, 4, 3);

        // Now black at (3,2) can capture (4,3) landing at (5,4)
        // But tries a simple move instead
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", blackToken);
        var response = await _client.PostAsJsonAsync(
            $"/api/games/{game.Id}/moves",
            new MakeMoveRequest(3, 2, 4, 1)); // simple move, not the capture
        _client.DefaultRequestHeaders.Authorization = null;

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    // ── Game completion ───────────────────────────────────────────────────────

    [Fact]
    public async Task MakeMove_LastCapture_CompletesGame()
    {
        var (_, blackToken) = await CreatePlayer("win_b");
        var (_, whiteToken) = await CreatePlayer("win_w");
        var game = await CreateGame(blackToken);
        await JoinGame(game.Id, whiteToken);

        // Seed near-endgame board: black at (3,3), white (last piece) at (4,4)
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<DamasDbContext>();
            var g = await db.Games.FindAsync(game.Id);
            var board = new int[8][];
            for (int r = 0; r < 8; r++) board[r] = new int[8];
            board[3][3] = BoardEngine.BlackMan;
            board[4][4] = BoardEngine.WhiteMan;
            var state = new BoardStateData { Cells = board };
            g!.BoardState = state.Serialize();
            await db.SaveChangesAsync();

            var cache = scope.ServiceProvider.GetRequiredService<IGameCacheService>();
            await cache.SetBoardStateAsync(game.Id, state);
        }

        // Black captures the last white piece → game over
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", blackToken);
        var response = await _client.PostAsJsonAsync(
            $"/api/games/{game.Id}/moves",
            new MakeMoveRequest(3, 3, 5, 5));
        _client.DefaultRequestHeaders.Authorization = null;

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var updated = await response.Content.ReadFromJsonAsync<GameResponse>(JsonOpts);
        Assert.NotNull(updated);
        Assert.Equal(GameStatus.Completed, updated.Status);
        Assert.NotNull(updated.WinnerId);
    }

    // ── Cache tests ──────────────────────────────────────────────────────────

    [Fact]
    public async Task Create_BoardStateIsPopulatedInCache()
    {
        var (_, token) = await CreatePlayer("cache_create");
        var game = await CreateGame(token);

        var cache = GetCache();
        var state = await cache.GetBoardStateAsync(game.Id);

        Assert.NotNull(state);
        Assert.Equal(8, state.Cells.Length);
    }

    [Fact]
    public async Task MakeMove_CacheIsUpdatedAfterMove()
    {
        var (_, blackToken) = await CreatePlayer("cache_move_b");
        var (_, whiteToken) = await CreatePlayer("cache_move_w");
        var game = await CreateGame(blackToken);
        await JoinGame(game.Id, whiteToken);

        var cache = GetCache();
        var before = await cache.GetBoardStateAsync(game.Id);
        Assert.NotNull(before);

        await MakeMove(game.Id, blackToken, 2, 1, 3, 0);

        var after = await cache.GetBoardStateAsync(game.Id);
        Assert.NotNull(after);
        Assert.NotEqual(before.Serialize(), after.Serialize());
    }

    [Fact]
    public async Task MakeMove_WorksAfterCacheEviction()
    {
        var (_, blackToken) = await CreatePlayer("cache_evict_b");
        var (_, whiteToken) = await CreatePlayer("cache_evict_w");
        var game = await CreateGame(blackToken);
        await JoinGame(game.Id, whiteToken);

        // Evict the cache
        var cache = GetCache();
        await cache.InvalidateAsync(game.Id);

        // Move should still work via DB fallback
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", blackToken);
        var response = await _client.PostAsJsonAsync(
            $"/api/games/{game.Id}/moves",
            new MakeMoveRequest(2, 1, 3, 0));
        _client.DefaultRequestHeaders.Authorization = null;

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private async Task<(Guid Id, string Token)> CreatePlayer(string suffix)
    {
        var req = new RegisterRequest($"gm_{suffix}", $"gm_{suffix}@test.com");
        var regResp = await _client.PostAsJsonAsync("/api/auth/register", req);
        regResp.EnsureSuccessStatusCode();
        var body = (await regResp.Content.ReadFromJsonAsync<RegisterResponse>(JsonOpts))!;

        var confirmCode = _email.GetCode(req.Email)!;
        await _client.PostAsJsonAsync("/api/auth/confirm-email", new ConfirmEmailRequest(req.Email, confirmCode));

        await _client.PostAsJsonAsync("/api/auth/login", new LoginRequest(req.Email));
        var loginCode = _email.GetLoginCode(req.Email)!;
        var verifyResp = await _client.PostAsJsonAsync("/api/auth/verify-login",
            new VerifyLoginRequest(req.Email, loginCode));
        verifyResp.EnsureSuccessStatusCode();
        var loginBody = (await verifyResp.Content.ReadFromJsonAsync<LoginResponse>(JsonOpts))!;

        return (body.Id, loginBody.Token);
    }

    private async Task<GameResponse> CreateGame(string token)
    {
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var response = await _client.PostAsync("/api/games", null);
        _client.DefaultRequestHeaders.Authorization = null;
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<GameResponse>(JsonOpts))!;
    }

    private async Task JoinGame(Guid gameId, string token)
    {
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var response = await _client.PostAsync($"/api/games/{gameId}/join", null);
        _client.DefaultRequestHeaders.Authorization = null;
        response.EnsureSuccessStatusCode();
    }

    private async Task MakeMove(Guid gameId, string token, int fromRow, int fromCol, int toRow, int toCol)
    {
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var response = await _client.PostAsJsonAsync(
            $"/api/games/{gameId}/moves",
            new MakeMoveRequest(fromRow, fromCol, toRow, toCol));
        _client.DefaultRequestHeaders.Authorization = null;
        response.EnsureSuccessStatusCode();
    }
}

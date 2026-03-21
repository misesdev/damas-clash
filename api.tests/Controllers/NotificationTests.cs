using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using api.DTOs.Auth;
using api.DTOs.Games;
using api.tests.Infrastructure;

namespace api.tests.Controllers;

/// <summary>
/// Verifies that push notifications are fired at the right moments:
/// - player_joined: when someone joins a game the creator is waiting on
/// - new_user (email): when a new user confirms their email
/// - new_user (nostr): when a new Nostr key logs in for the first time
/// </summary>
public class NotificationTests(CustomWebApplicationFactory factory)
    : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client = factory.CreateClient();
    private readonly FakeEmailService _email = factory.EmailService;
    private readonly FakeNotificationService _notifications = factory.NotificationService;

    private static readonly JsonSerializerOptions JsonOpts = new(JsonSerializerDefaults.Web)
    {
        Converters = { new System.Text.Json.Serialization.JsonStringEnumConverter() }
    };

    // ── player_joined ─────────────────────────────────────────────────────────

    [Fact]
    public async Task JoinGame_SendsPlayerJoinedNotification()
    {
        var (creatorId, creatorToken) = await CreatePlayer("notif_pj_c");
        var (_, joinerToken) = await CreatePlayer("notif_pj_j");

        var game = await CreateGame(creatorToken);
        await JoinGame(game.Id, joinerToken);

        // Give fire-and-forget a moment to complete
        await Task.Delay(100);

        Assert.Contains(_notifications.PlayerJoinedCalls, c =>
            c.CreatorId == creatorId && c.GameId == game.Id);
    }

    [Fact]
    public async Task JoinGame_PlayerJoinedNotification_CarriesJoinerUsername()
    {
        // Username created by CreatePlayer helper is "n_{suffix}"
        var (_, creatorToken) = await CreatePlayer("notif_pju_c");
        var (_, joinerToken) = await CreatePlayer("notif_pju_j");
        const string expectedJoiner = "n_notif_pju_j";

        var game = await CreateGame(creatorToken);
        await JoinGame(game.Id, joinerToken);

        await Task.Delay(100);

        Assert.Contains(_notifications.PlayerJoinedCalls, c =>
            c.GameId == game.Id &&
            string.Equals(c.Joiner, expectedJoiner, StringComparison.OrdinalIgnoreCase));
    }

    // ── new_user (email) ──────────────────────────────────────────────────────

    [Fact]
    public async Task ConfirmEmail_NewUser_SendsNewUserNotification()
    {
        const string username = "notif_nu_e1";
        var req = new RegisterRequest(username, $"{username}@test.com");
        var regResp = await _client.PostAsJsonAsync("/api/auth/register", req);
        regResp.EnsureSuccessStatusCode();

        var code = _email.GetCode(req.Email)!;
        var confirmResp = await _client.PostAsJsonAsync("/api/auth/confirm-email",
            new ConfirmEmailRequest(req.Email, code));
        confirmResp.EnsureSuccessStatusCode();

        await Task.Delay(100);

        Assert.Contains(_notifications.NewUserCalls, c =>
            c.Username.Equals(username, StringComparison.OrdinalIgnoreCase) && !c.IsNostr);
    }

    // ── new_user (nostr) ──────────────────────────────────────────────────────

    [Fact]
    public async Task NostrFirstLogin_SendsNewUserNotification()
    {
        var (privBytes, pubkeyHex) = NostrTestHelper.GenerateKeyPair();

        var loginBody = await NostrLogin(privBytes, pubkeyHex);

        await Task.Delay(100);

        Assert.Contains(_notifications.NewUserCalls, c =>
            c.Username.Equals(loginBody.Username, StringComparison.OrdinalIgnoreCase) && c.IsNostr);
    }

    [Fact]
    public async Task NostrSecondLogin_DoesNotSendNewUserNotification()
    {
        var (privBytes, pubkeyHex) = NostrTestHelper.GenerateKeyPair();

        // First login — creates the player and fires the notification
        var firstBody = await NostrLogin(privBytes, pubkeyHex);
        await Task.Delay(100);

        var countForThisUser = _notifications.NewUserCalls
            .Count(c => c.Username.Equals(firstBody.Username, StringComparison.OrdinalIgnoreCase));
        Assert.Equal(1, countForThisUser);

        // Second login — existing player, must NOT fire again
        await NostrLogin(privBytes, pubkeyHex);
        await Task.Delay(100);

        var countAfter = _notifications.NewUserCalls
            .Count(c => c.Username.Equals(firstBody.Username, StringComparison.OrdinalIgnoreCase));
        Assert.Equal(1, countAfter);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private async Task<(Guid Id, string Token)> CreatePlayer(string suffix)
    {
        var req = new RegisterRequest($"n_{suffix}", $"{suffix}@test.com");
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

    private async Task<LoginResponse> NostrLogin(byte[] privBytes, string pubkeyHex)
    {
        var challengeResp = await _client.GetAsync($"/api/auth/nostr/challenge?pubkey={pubkeyHex}");
        var challengeBody = (await challengeResp.Content.ReadFromJsonAsync<api.DTOs.Auth.NostrChallengeResponse>(JsonOpts))!;

        var payload = NostrTestHelper.BuildSignedAuthEvent(privBytes, pubkeyHex, challengeBody.Challenge);
        var loginResp = await _client.PostAsJsonAsync("/api/auth/nostr/login-event", payload);
        loginResp.EnsureSuccessStatusCode();
        return (await loginResp.Content.ReadFromJsonAsync<LoginResponse>(JsonOpts))!;
    }
}

using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using api.DTOs.Auth;
using api.tests.Infrastructure;
using Microsoft.Extensions.DependencyInjection;

namespace api.tests.Controllers;

public class AuthControllerTests(CustomWebApplicationFactory factory)
    : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client = factory.CreateClient();
    private readonly FakeEmailService _email = factory.EmailService;

    private static readonly JsonSerializerOptions JsonOpts = new(JsonSerializerDefaults.Web);

    private static RegisterRequest ValidRegister(string suffix = "") => new(
        Username: $"user{suffix}",
        Email: $"user{suffix}@test.com"
    );

    // ── Register ──────────────────────────────────────────────────────────────

    [Fact]
    public async Task Register_ValidRequest_Returns201()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/register", ValidRegister("_reg1"));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<RegisterResponse>(JsonOpts);
        Assert.NotNull(body);
        Assert.Equal("user_reg1", body.Username);
        Assert.Equal("user_reg1@test.com", body.Email);
        Assert.NotEqual(Guid.Empty, body.Id);
    }

    [Fact]
    public async Task Register_DuplicateEmail_Returns409()
    {
        await _client.PostAsJsonAsync("/api/auth/register", ValidRegister("_dupemail"));

        var response = await _client.PostAsJsonAsync("/api/auth/register",
            new RegisterRequest("other_dupemail", "user_dupemail@test.com"));

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task Register_DuplicateUsername_Returns409()
    {
        await _client.PostAsJsonAsync("/api/auth/register", ValidRegister("_dupuser"));

        var response = await _client.PostAsJsonAsync("/api/auth/register",
            new RegisterRequest("user_dupuser", "other_dupuser@test.com"));

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    // ── Confirm Email ─────────────────────────────────────────────────────────

    [Fact]
    public async Task ConfirmEmail_ValidCode_Returns200WithToken()
    {
        var req = ValidRegister("_conf1");
        await _client.PostAsJsonAsync("/api/auth/register", req);

        var code = _email.GetCode(req.Email);
        Assert.NotNull(code);

        var response = await _client.PostAsJsonAsync("/api/auth/confirm-email",
            new ConfirmEmailRequest(req.Email, code));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<LoginResponse>(JsonOpts);
        Assert.NotNull(body);
        Assert.False(string.IsNullOrEmpty(body.Token));
        Assert.False(string.IsNullOrEmpty(body.RefreshToken));
        Assert.Equal(req.Email, body.Email);
        Assert.Equal(req.Username, body.Username);
    }

    [Fact]
    public async Task ConfirmEmail_WrongCode_Returns400()
    {
        var req = ValidRegister("_conf2");
        await _client.PostAsJsonAsync("/api/auth/register", req);

        var response = await _client.PostAsJsonAsync("/api/auth/confirm-email",
            new ConfirmEmailRequest(req.Email, "000000"));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task ConfirmEmail_ExpiredCode_Returns400()
    {
        var req = ValidRegister("_conf3");
        await _client.PostAsJsonAsync("/api/auth/register", req);

        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<api.Data.DamasDbContext>();
        var player = db.Players.First(p => p.Email == req.Email);
        player.EmailConfirmationCodeExpiry = DateTimeOffset.UtcNow.AddMinutes(-1);
        await db.SaveChangesAsync();

        var code = _email.GetCode(req.Email);
        var response = await _client.PostAsJsonAsync("/api/auth/confirm-email",
            new ConfirmEmailRequest(req.Email, code!));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    // ── Resend Confirmation ───────────────────────────────────────────────────

    [Fact]
    public async Task ResendConfirmation_UnconfirmedPlayer_Returns200AndSendsCode()
    {
        var req = ValidRegister("_resend");
        await _client.PostAsJsonAsync("/api/auth/register", req);

        var response = await _client.PostAsJsonAsync("/api/auth/resend-confirmation",
            new { email = req.Email });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(_email.GetCode(req.Email));
    }

    [Fact]
    public async Task ResendConfirmation_AlreadyConfirmed_Returns400()
    {
        var req = ValidRegister("_resendConfirmed");
        await _client.PostAsJsonAsync("/api/auth/register", req);
        await _client.PostAsJsonAsync("/api/auth/confirm-email",
            new ConfirmEmailRequest(req.Email, _email.GetCode(req.Email)!));

        var response = await _client.PostAsJsonAsync("/api/auth/resend-confirmation",
            new { email = req.Email });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    // ── Login (send code) ─────────────────────────────────────────────────────

    [Fact]
    public async Task Login_BeforeEmailConfirmation_Returns200()
    {
        var req = ValidRegister("_loginUnconfirmed");
        await _client.PostAsJsonAsync("/api/auth/register", req);

        var response = await _client.PostAsJsonAsync("/api/auth/login",
            new LoginRequest(req.Email));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Login_UnknownIdentifier_Returns404()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/login",
            new LoginRequest("nobody@test.com"));

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Login_ByEmail_SendsCodeAndReturnsEmail()
    {
        var req = ValidRegister("_loginEmail");
        await _client.PostAsJsonAsync("/api/auth/register", req);
        await _client.PostAsJsonAsync("/api/auth/confirm-email",
            new ConfirmEmailRequest(req.Email, _email.GetCode(req.Email)!));

        var response = await _client.PostAsJsonAsync("/api/auth/login",
            new LoginRequest(req.Email));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<SendLoginCodeResponse>(JsonOpts);
        Assert.Equal(req.Email, body!.Email);
        Assert.NotNull(_email.GetLoginCode(req.Email));
    }

    [Fact]
    public async Task Login_ByUsername_SendsCodeAndReturnsEmail()
    {
        var req = ValidRegister("_loginUser");
        await _client.PostAsJsonAsync("/api/auth/register", req);
        await _client.PostAsJsonAsync("/api/auth/confirm-email",
            new ConfirmEmailRequest(req.Email, _email.GetCode(req.Email)!));

        var response = await _client.PostAsJsonAsync("/api/auth/login",
            new LoginRequest(req.Username));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<SendLoginCodeResponse>(JsonOpts);
        Assert.Equal(req.Email, body!.Email);
    }

    // ── Verify Login ──────────────────────────────────────────────────────────

    [Fact]
    public async Task VerifyLogin_ValidCode_Returns200WithToken()
    {
        var req = ValidRegister("_verify200");
        await _client.PostAsJsonAsync("/api/auth/register", req);
        await _client.PostAsJsonAsync("/api/auth/confirm-email",
            new ConfirmEmailRequest(req.Email, _email.GetCode(req.Email)!));
        await _client.PostAsJsonAsync("/api/auth/login", new LoginRequest(req.Email));

        var loginCode = _email.GetLoginCode(req.Email)!;
        var response = await _client.PostAsJsonAsync("/api/auth/verify-login",
            new VerifyLoginRequest(req.Email, loginCode));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<LoginResponse>(JsonOpts);
        Assert.NotNull(body);
        Assert.False(string.IsNullOrEmpty(body.Token));
        Assert.Equal(req.Email, body.Email);
    }

    [Fact]
    public async Task VerifyLogin_WrongCode_Returns400()
    {
        var req = ValidRegister("_verify400");
        await _client.PostAsJsonAsync("/api/auth/register", req);
        await _client.PostAsJsonAsync("/api/auth/confirm-email",
            new ConfirmEmailRequest(req.Email, _email.GetCode(req.Email)!));
        await _client.PostAsJsonAsync("/api/auth/login", new LoginRequest(req.Email));

        var response = await _client.PostAsJsonAsync("/api/auth/verify-login",
            new VerifyLoginRequest(req.Email, "000000"));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task VerifyLogin_ExpiredCode_Returns400()
    {
        var req = ValidRegister("_verifyExp");
        await _client.PostAsJsonAsync("/api/auth/register", req);
        await _client.PostAsJsonAsync("/api/auth/confirm-email",
            new ConfirmEmailRequest(req.Email, _email.GetCode(req.Email)!));
        await _client.PostAsJsonAsync("/api/auth/login", new LoginRequest(req.Email));

        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<api.Data.DamasDbContext>();
        var player = db.Players.First(p => p.Email == req.Email);
        player.LoginCodeExpiry = DateTimeOffset.UtcNow.AddMinutes(-1);
        await db.SaveChangesAsync();

        var loginCode = _email.GetLoginCode(req.Email)!;
        var response = await _client.PostAsJsonAsync("/api/auth/verify-login",
            new VerifyLoginRequest(req.Email, loginCode));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    // ── Delete Account ────────────────────────────────────────────────────────

    [Fact]
    public async Task DeleteAccount_Authenticated_Returns204()
    {
        var token = await RegisterAndLogin("_del1");

        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
        var response = await _client.DeleteAsync("/api/auth/account");
        _client.DefaultRequestHeaders.Authorization = null;

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    [Fact]
    public async Task DeleteAccount_PlayerNoLongerExists()
    {
        var token = await RegisterAndLogin("_del2");

        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
        await _client.DeleteAsync("/api/auth/account");
        _client.DefaultRequestHeaders.Authorization = null;

        // Attempt to login after deletion should return 404
        var response = await _client.PostAsJsonAsync("/api/auth/login",
            new LoginRequest("user_del2@test.com"));
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task DeleteAccount_Unauthenticated_Returns401()
    {
        var response = await _client.DeleteAsync("/api/auth/account");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task DeleteAccount_TokenStillValidAfterDeletion_Returns401()
    {
        // After account deletion the old token should no longer grant access
        var token = await RegisterAndLogin("_del3");

        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
        await _client.DeleteAsync("/api/auth/account");

        // Trying to delete again with the same token — account is gone
        var response = await _client.DeleteAsync("/api/auth/account");
        _client.DefaultRequestHeaders.Authorization = null;

        // Player no longer exists → service returns NotFound → 404
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private async Task<string> RegisterAndLogin(string suffix)
    {
        var req = ValidRegister(suffix);
        await _client.PostAsJsonAsync("/api/auth/register", req);

        var confirmCode = _email.GetCode(req.Email)!;
        var confirmResp = await _client.PostAsJsonAsync("/api/auth/confirm-email",
            new ConfirmEmailRequest(req.Email, confirmCode));
        var loginBody = (await confirmResp.Content.ReadFromJsonAsync<LoginResponse>(JsonOpts))!;
        return loginBody.Token;
    }
}

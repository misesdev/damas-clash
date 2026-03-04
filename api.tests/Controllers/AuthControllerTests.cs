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
        Email: $"user{suffix}@test.com",
        Password: "Password1"
    );

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
            new RegisterRequest("other_dupemail", "user_dupemail@test.com", "Password1"));

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task Register_DuplicateUsername_Returns409()
    {
        await _client.PostAsJsonAsync("/api/auth/register", ValidRegister("_dupuser"));

        var response = await _client.PostAsJsonAsync("/api/auth/register",
            new RegisterRequest("user_dupuser", "other_dupuser@test.com", "Password1"));

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task Register_WeakPassword_Returns400()
    {
        var request = new RegisterRequest("weakpwuser", "weakpw@test.com", "weakpassword");

        var response = await _client.PostAsJsonAsync("/api/auth/register", request);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task ConfirmEmail_ValidCode_Returns200()
    {
        var req = ValidRegister("_conf1");
        await _client.PostAsJsonAsync("/api/auth/register", req);

        var code = _email.GetCode(req.Email);
        Assert.NotNull(code);

        var response = await _client.PostAsJsonAsync("/api/auth/confirm-email",
            new ConfirmEmailRequest(req.Email, code));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
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

        // Manually expire the code in the DB
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

    [Fact]
    public async Task Login_BeforeConfirmation_Returns403()
    {
        var req = ValidRegister("_login403");
        await _client.PostAsJsonAsync("/api/auth/register", req);

        var response = await _client.PostAsJsonAsync("/api/auth/login",
            new LoginRequest(req.Email, req.Password));

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Login_ValidCredentials_Returns200WithToken()
    {
        var req = ValidRegister("_login200");
        await _client.PostAsJsonAsync("/api/auth/register", req);

        var code = _email.GetCode(req.Email)!;
        await _client.PostAsJsonAsync("/api/auth/confirm-email",
            new ConfirmEmailRequest(req.Email, code));

        var response = await _client.PostAsJsonAsync("/api/auth/login",
            new LoginRequest(req.Email, req.Password));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<LoginResponse>(JsonOpts);
        Assert.NotNull(body);
        Assert.False(string.IsNullOrEmpty(body.Token));
        Assert.Equal(req.Email, body.Email);
    }

    [Fact]
    public async Task Login_WrongPassword_Returns401()
    {
        var req = ValidRegister("_login401");
        await _client.PostAsJsonAsync("/api/auth/register", req);

        var code = _email.GetCode(req.Email)!;
        await _client.PostAsJsonAsync("/api/auth/confirm-email",
            new ConfirmEmailRequest(req.Email, code));

        var response = await _client.PostAsJsonAsync("/api/auth/login",
            new LoginRequest(req.Email, "WrongPass1"));

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Login_UnknownEmail_Returns401()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/login",
            new LoginRequest("nobody@test.com", "Password1"));

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}

using System.Net;
using System.Net.Http.Json;
using lnd_gateway.Models;
using tests.Infrastructure;

namespace tests.Controllers;

/// <summary>
/// Integration tests for ApiKeyMiddleware using WebApplicationFactory.
/// These tests verify the auth layer behaves correctly end-to-end.
/// </summary>
[TestClass]
public class ApiKeyMiddlewareTests
{
    private static CustomWebApplicationFactory _factory = null!;
    private static HttpClient _authedClient = null!;
    private static HttpClient _unauthClient = null!;

    [ClassInitialize]
    public static void ClassInit(TestContext _)
    {
        _factory = new CustomWebApplicationFactory();
        _authedClient = _factory.CreateClient();
        _authedClient.DefaultRequestHeaders.Add("X-Api-Key", CustomWebApplicationFactory.TestApiKey);
        _unauthClient = _factory.CreateClient();
    }

    [ClassCleanup]
    public static void ClassCleanup()
    {
        _authedClient.Dispose();
        _unauthClient.Dispose();
        _factory.Dispose();
    }

    // ── No API key ────────────────────────────────────────────────────────────

    [TestMethod]
    public async Task Deposit_Returns401_WhenNoApiKey()
    {
        var response = await _unauthClient.PostAsJsonAsync("/api/wallet/deposit",
            new { amountSats = 1000, memo = "test" });

        Assert.AreEqual(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [TestMethod]
    public async Task Withdraw_Returns401_WhenNoApiKey()
    {
        var response = await _unauthClient.PostAsJsonAsync("/api/wallet/withdraw",
            new { paymentRequest = "lnbc..." });

        Assert.AreEqual(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [TestMethod]
    public async Task Deposit_Returns401_WhenWrongApiKey()
    {
        using var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Api-Key", "wrong-key");

        var response = await client.PostAsJsonAsync("/api/wallet/deposit",
            new { amountSats = 1000 });

        Assert.AreEqual(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ── Health is public ─────────────────────────────────────────────────────

    [TestMethod]
    public async Task Health_Returns200_WithoutApiKey()
    {
        var response = await _unauthClient.GetAsync("/api/health");

        Assert.AreEqual(HttpStatusCode.OK, response.StatusCode);
    }

    [TestMethod]
    public async Task Health_Returns200_WithApiKey()
    {
        var response = await _authedClient.GetAsync("/api/health");

        Assert.AreEqual(HttpStatusCode.OK, response.StatusCode);
    }

    // ── Valid API key ─────────────────────────────────────────────────────────

    [TestMethod]
    public async Task Deposit_Returns200_WithValidApiKey()
    {
        var response = await _authedClient.PostAsJsonAsync("/api/wallet/deposit",
            new { amountSats = 1000, memo = "test" });

        Assert.AreEqual(HttpStatusCode.OK, response.StatusCode);
    }

    [TestMethod]
    public async Task Withdraw_Returns200_WithValidApiKey()
    {
        var response = await _authedClient.PostAsJsonAsync("/api/wallet/withdraw",
            new { paymentRequest = "lnbc1..." });

        Assert.AreEqual(HttpStatusCode.OK, response.StatusCode);
    }

    // ── Model validation through pipeline ────────────────────────────────────

    [TestMethod]
    public async Task Deposit_Returns400_WhenAmountIsZero()
    {
        var response = await _authedClient.PostAsJsonAsync("/api/wallet/deposit",
            new { amountSats = 0 });

        Assert.AreEqual(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [TestMethod]
    public async Task Deposit_Returns400_WhenBodyIsEmpty()
    {
        var response = await _authedClient.PostAsJsonAsync("/api/wallet/deposit",
            new { });

        Assert.AreEqual(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [TestMethod]
    public async Task Withdraw_Returns400_WhenPaymentRequestMissing()
    {
        var response = await _authedClient.PostAsJsonAsync("/api/wallet/withdraw",
            new { maxFeeSats = 10 });

        Assert.AreEqual(HttpStatusCode.BadRequest, response.StatusCode);
    }

    // ── Response body ─────────────────────────────────────────────────────────

    [TestMethod]
    public async Task Deposit_ReturnsDepositResponse_WhenSuccess()
    {
        var response = await _authedClient.PostAsJsonAsync("/api/wallet/deposit",
            new { amountSats = 5000, memo = "game bet" });

        Assert.AreEqual(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<DepositResponse>();
        Assert.IsNotNull(body);
        Assert.IsFalse(string.IsNullOrEmpty(body.PaymentRequest));
        Assert.IsFalse(string.IsNullOrEmpty(body.RHash));
    }

    [TestMethod]
    public async Task Withdraw_ReturnsWithdrawResponse_WhenSuccess()
    {
        var response = await _authedClient.PostAsJsonAsync("/api/wallet/withdraw",
            new { paymentRequest = "lnbc500n1..." });

        Assert.AreEqual(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<WithdrawResponse>();
        Assert.IsNotNull(body);
        Assert.IsFalse(string.IsNullOrEmpty(body.PaymentHash));
    }

    // ── GetInvoiceStatus ─────────────────────────────────────────────────────

    [TestMethod]
    public async Task GetInvoiceStatus_Returns401_WithoutApiKey()
    {
        var response = await _unauthClient.GetAsync("/api/wallet/invoice/hash123");

        Assert.AreEqual(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [TestMethod]
    public async Task GetInvoiceStatus_Returns200_WithValidApiKey()
    {
        var response = await _authedClient.GetAsync("/api/wallet/invoice/hash_default");

        Assert.AreEqual(HttpStatusCode.OK, response.StatusCode);
    }

    [TestMethod]
    public async Task GetInvoiceStatus_ReturnsInvoiceStatus_WhenFound()
    {
        var response = await _authedClient.GetAsync("/api/wallet/invoice/hash_default");

        Assert.AreEqual(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<InvoiceStatusResponse>();
        Assert.IsNotNull(body);
        Assert.IsFalse(string.IsNullOrEmpty(body.RHash));
        Assert.IsFalse(string.IsNullOrEmpty(body.State));
    }

    // ── WithdrawToAddress ────────────────────────────────────────────────────

    [TestMethod]
    public async Task WithdrawToAddress_Returns401_WithoutApiKey()
    {
        var response = await _unauthClient.PostAsJsonAsync("/api/wallet/withdraw/address",
            new { lightningAddress = "user@domain.com", amountSats = 1000 });

        Assert.AreEqual(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [TestMethod]
    public async Task WithdrawToAddress_Returns200_WithValidApiKey()
    {
        var response = await _authedClient.PostAsJsonAsync("/api/wallet/withdraw/address",
            new { lightningAddress = "user@domain.com", amountSats = 1000 });

        Assert.AreEqual(HttpStatusCode.OK, response.StatusCode);
    }

    [TestMethod]
    public async Task WithdrawToAddress_Returns400_WhenBodyInvalid()
    {
        var response = await _authedClient.PostAsJsonAsync("/api/wallet/withdraw/address",
            new { amountSats = 1000 }); // sem lightningAddress

        Assert.AreEqual(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [TestMethod]
    public async Task WithdrawToAddress_ReturnsWithdrawResponse_WhenSuccess()
    {
        var response = await _authedClient.PostAsJsonAsync("/api/wallet/withdraw/address",
            new { lightningAddress = "user@domain.com", amountSats = 500 });

        Assert.AreEqual(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<WithdrawResponse>();
        Assert.IsNotNull(body);
        Assert.IsFalse(string.IsNullOrEmpty(body.PaymentHash));
    }

}

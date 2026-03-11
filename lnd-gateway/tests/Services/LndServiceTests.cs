using System.Net;
using System.Text;
using System.Text.Json;
using lnd_gateway.Services;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Moq.Protected;

namespace tests.Services;

[TestClass]
public class LndServiceTests
{
    private Mock<HttpMessageHandler> _handlerMock = null!;
    private LndService _service = null!;

    [TestInitialize]
    public void Init()
    {
        _handlerMock = new Mock<HttpMessageHandler>();
        var client = new HttpClient(_handlerMock.Object)
        {
            BaseAddress = new Uri("https://localhost:10009")
        };
        client.DefaultRequestHeaders.Add("Grpc-Metadata-Macaroon", "test-macaroon");
        _service = new LndService(client, NullLogger<LndService>.Instance);
    }

    private void SetupResponse(string path, HttpStatusCode status, object body)
    {
        var json = JsonSerializer.Serialize(body);
        _handlerMock.Protected()
            .Setup<Task<HttpResponseMessage>>("SendAsync",
                ItExpr.Is<HttpRequestMessage>(r => r.RequestUri!.AbsolutePath == path),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(new HttpResponseMessage(status)
            {
                Content = new StringContent(json, Encoding.UTF8, "application/json")
            });
    }

    // Bytes [0x01..0x20]: base64 padrão = "AQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyA="
    //                     hex           = "0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20"
    //                     url-safe b64  = "AQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyA"
    private const string SampleBase64    = "AQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyA=";
    private const string SampleHex       = "0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20";
    private const string SampleUrlSafeB64 = "AQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyA";

    // ── CreateInvoiceAsync ───────────────────────────────────────────────────

    [TestMethod]
    public async Task CreateInvoiceAsync_ReturnsDeposit_WhenLndSucceeds()
    {
        SetupResponse("/v1/invoices", HttpStatusCode.OK, new
        {
            r_hash = SampleBase64,          // LND retorna base64
            payment_request = "lnbc1000n1...",
            add_index = "1"
        });

        var result = await _service.CreateInvoiceAsync(1000, "test deposit");

        Assert.IsTrue(result.Success);
        Assert.AreEqual("lnbc1000n1...", result.Value!.PaymentRequest);
        Assert.AreEqual(SampleHex, result.Value.RHash);  // API retorna hex
        // ExpiresAt must be in the future (lowerBound, value) → value > lowerBound
        Assert.IsGreaterThan(DateTimeOffset.UtcNow.ToUnixTimeSeconds(), result.Value.ExpiresAt);
    }

    [TestMethod]
    public async Task CreateInvoiceAsync_ReturnsFail_WhenLndReturns500()
    {
        SetupResponse("/v1/invoices", HttpStatusCode.InternalServerError, new { error = "internal error" });

        var result = await _service.CreateInvoiceAsync(1000, null);

        Assert.IsFalse(result.Success);
        Assert.IsNotNull(result.Error);
        StringAssert.Contains(result.Error, "LND error:");
    }

    [TestMethod]
    public async Task CreateInvoiceAsync_ReturnsFail_WhenHttpThrows()
    {
        _handlerMock.Protected()
            .Setup<Task<HttpResponseMessage>>("SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .ThrowsAsync(new HttpRequestException("connection refused"));

        var result = await _service.CreateInvoiceAsync(500, "memo");

        Assert.IsFalse(result.Success);
        StringAssert.Contains(result.Error, "connection refused");
    }

    [TestMethod]
    public async Task CreateInvoiceAsync_SendsCorrectAmountAndMemo()
    {
        string? capturedBody = null;
        _handlerMock.Protected()
            .Setup<Task<HttpResponseMessage>>("SendAsync",
                ItExpr.Is<HttpRequestMessage>(r => r.RequestUri!.AbsolutePath == "/v1/invoices"),
                ItExpr.IsAny<CancellationToken>())
            .Callback<HttpRequestMessage, CancellationToken>(async (req, _) =>
            {
                capturedBody = await req.Content!.ReadAsStringAsync();
            })
            .ReturnsAsync(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(
                    JsonSerializer.Serialize(new { r_hash = "h", payment_request = "lnbc...", add_index = "1" }),
                    Encoding.UTF8, "application/json")
            });

        await _service.CreateInvoiceAsync(2500, "deposit for game");

        Assert.IsNotNull(capturedBody);
        StringAssert.Contains(capturedBody, "2500");
        StringAssert.Contains(capturedBody, "deposit for game");
    }

    [TestMethod]
    public async Task CreateInvoiceAsync_ReturnsFail_WhenResponseBodyIsNull()
    {
        _handlerMock.Protected()
            .Setup<Task<HttpResponseMessage>>("SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("null", Encoding.UTF8, "application/json")
            });

        var result = await _service.CreateInvoiceAsync(100, null);

        Assert.IsFalse(result.Success);
    }

    // ── PayInvoiceAsync ──────────────────────────────────────────────────────

    [TestMethod]
    public async Task PayInvoiceAsync_ReturnsWithdraw_WhenPaymentSucceeds()
    {
        // LND retorna payment_hash e payment_preimage em base64; API converte para hex
        SetupResponse("/v1/channels/transactions", HttpStatusCode.OK, new
        {
            payment_error = "",
            payment_preimage = SampleBase64,
            payment_hash = SampleBase64,
            payment_route = new { total_fees = "5" }
        });

        var result = await _service.PayInvoiceAsync("lnbc500n1...", null);

        Assert.IsTrue(result.Success);
        Assert.AreEqual(SampleHex, result.Value!.PaymentHash);
        Assert.AreEqual(SampleHex, result.Value.PaymentPreimage);
        Assert.AreEqual(5L, result.Value.FeePaidSats);
    }

    [TestMethod]
    public async Task PayInvoiceAsync_ReturnsFail_WhenPaymentErrorReturned()
    {
        SetupResponse("/v1/channels/transactions", HttpStatusCode.OK, new
        {
            payment_error = "insufficient funds",
            payment_preimage = "",
            payment_hash = ""
        });

        var result = await _service.PayInvoiceAsync("lnbc...", null);

        Assert.IsFalse(result.Success);
        Assert.AreEqual("insufficient funds", result.Error);
    }

    [TestMethod]
    public async Task PayInvoiceAsync_ReturnsFail_WhenLndReturns400()
    {
        SetupResponse("/v1/channels/transactions", HttpStatusCode.BadRequest, new { error = "bad request" });

        var result = await _service.PayInvoiceAsync("lnbc...", null);

        Assert.IsFalse(result.Success);
        StringAssert.Contains(result.Error!, "LND error:");
    }

    [TestMethod]
    public async Task PayInvoiceAsync_ReturnsFail_WhenHttpThrows()
    {
        _handlerMock.Protected()
            .Setup<Task<HttpResponseMessage>>("SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .ThrowsAsync(new TaskCanceledException("timeout"));

        var result = await _service.PayInvoiceAsync("lnbc...", null);

        Assert.IsFalse(result.Success);
        Assert.IsNotNull(result.Error);
    }

    [TestMethod]
    public async Task PayInvoiceAsync_UsesDefaultFee10_WhenMaxFeeSatsIsNull()
    {
        string? capturedBody = null;
        _handlerMock.Protected()
            .Setup<Task<HttpResponseMessage>>("SendAsync",
                ItExpr.Is<HttpRequestMessage>(r => r.RequestUri!.AbsolutePath == "/v1/channels/transactions"),
                ItExpr.IsAny<CancellationToken>())
            .Callback<HttpRequestMessage, CancellationToken>(async (req, _) =>
            {
                capturedBody = await req.Content!.ReadAsStringAsync();
            })
            .ReturnsAsync(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(
                    JsonSerializer.Serialize(new { payment_error = "", payment_preimage = SampleBase64, payment_hash = SampleBase64 }),
                    Encoding.UTF8, "application/json")
            });

        await _service.PayInvoiceAsync("lnbc...", null);

        Assert.IsNotNull(capturedBody);
        StringAssert.Contains(capturedBody, "\"10\"");
    }

    [TestMethod]
    public async Task PayInvoiceAsync_UsesCustomFee_WhenMaxFeeSatsProvided()
    {
        string? capturedBody = null;
        _handlerMock.Protected()
            .Setup<Task<HttpResponseMessage>>("SendAsync",
                ItExpr.Is<HttpRequestMessage>(r => r.RequestUri!.AbsolutePath == "/v1/channels/transactions"),
                ItExpr.IsAny<CancellationToken>())
            .Callback<HttpRequestMessage, CancellationToken>(async (req, _) =>
            {
                capturedBody = await req.Content!.ReadAsStringAsync();
            })
            .ReturnsAsync(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(
                    JsonSerializer.Serialize(new { payment_error = "", payment_preimage = SampleBase64, payment_hash = SampleBase64 }),
                    Encoding.UTF8, "application/json")
            });

        await _service.PayInvoiceAsync("lnbc...", 25L);

        Assert.IsNotNull(capturedBody);
        StringAssert.Contains(capturedBody, "\"25\"");
    }

    [TestMethod]
    public async Task PayInvoiceAsync_ReturnsZeroFee_WhenRouteIsNull()
    {
        SetupResponse("/v1/channels/transactions", HttpStatusCode.OK, new
        {
            payment_error = "",
            payment_preimage = SampleBase64,
            payment_hash = SampleBase64
            // no payment_route
        });

        var result = await _service.PayInvoiceAsync("lnbc...", null);

        Assert.IsTrue(result.Success);
        Assert.AreEqual(0L, result.Value!.FeePaidSats);
    }

    // ── GetInvoiceAsync ──────────────────────────────────────────────────────

    [TestMethod]
    public async Task GetInvoiceAsync_ReturnsSettled_WhenInvoicePaid()
    {
        // LND REST GET /v1/invoice/{r_hash_str} espera hex no path
        SetupResponse($"/v1/invoice/{SampleHex}", HttpStatusCode.OK, new
        {
            r_hash = SampleBase64,
            value = "1000",
            settled = true,
            state = "SETTLED",
            amt_paid_sat = "1000",
            memo = "game bet"
        });

        var result = await _service.GetInvoiceAsync(SampleHex);

        Assert.IsTrue(result.Success);
        Assert.AreEqual("SETTLED", result.Value!.State);
        Assert.IsTrue(result.Value.Settled);
        Assert.AreEqual(SampleHex, result.Value.RHash);  // retorna hex
        Assert.AreEqual(1000L, result.Value.AmountSats);
        Assert.AreEqual(1000L, result.Value.AmountPaidSats);
        Assert.AreEqual("game bet", result.Value.Memo);
    }

    [TestMethod]
    public async Task GetInvoiceAsync_ReturnsOpen_WhenNotYetPaid()
    {
        SetupResponse($"/v1/invoice/{SampleHex}", HttpStatusCode.OK, new
        {
            r_hash = SampleBase64,
            value = "500",
            settled = false,
            state = "OPEN",
            amt_paid_sat = "0",
            memo = ""
        });

        var result = await _service.GetInvoiceAsync(SampleHex);

        Assert.IsTrue(result.Success);
        Assert.AreEqual("OPEN", result.Value!.State);
        Assert.IsFalse(result.Value.Settled);
        Assert.AreEqual(0L, result.Value.AmountPaidSats);
    }

    [TestMethod]
    public async Task GetInvoiceAsync_ReturnsFail_WhenNotFound()
    {
        SetupResponse($"/v1/invoice/{SampleHex}", HttpStatusCode.NotFound, new { error = "not found" });

        var result = await _service.GetInvoiceAsync(SampleHex);

        Assert.IsFalse(result.Success);
        Assert.AreEqual("Invoice not found", result.Error);
    }

    [TestMethod]
    public async Task GetInvoiceAsync_ReturnsFail_WhenLndError()
    {
        SetupResponse($"/v1/invoice/{SampleHex}", HttpStatusCode.InternalServerError, new { error = "internal" });

        var result = await _service.GetInvoiceAsync(SampleHex);

        Assert.IsFalse(result.Success);
        StringAssert.Contains(result.Error!, "LND error:");
    }

    [TestMethod]
    public async Task GetInvoiceAsync_ReturnsFail_WhenHttpThrows()
    {
        _handlerMock.Protected()
            .Setup<Task<HttpResponseMessage>>("SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .ThrowsAsync(new HttpRequestException("network error"));

        var result = await _service.GetInvoiceAsync(SampleHex);

        Assert.IsFalse(result.Success);
        StringAssert.Contains(result.Error!, "network error");
    }

    [TestMethod]
    public async Task GetInvoiceAsync_SendsHexDirectlyInPath()
    {
        string? capturedPath = null;
        _handlerMock.Protected()
            .Setup<Task<HttpResponseMessage>>("SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .Callback<HttpRequestMessage, CancellationToken>((req, _) =>
            {
                capturedPath = req.RequestUri!.AbsolutePath;
            })
            .ReturnsAsync(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(
                    JsonSerializer.Serialize(new { r_hash = SampleBase64, value = "0", settled = false, state = "OPEN", amt_paid_sat = "0", memo = "" }),
                    Encoding.UTF8, "application/json")
            });

        await _service.GetInvoiceAsync(SampleHex);

        Assert.IsNotNull(capturedPath);
        // LND REST GET /v1/invoice/{r_hash_str} espera hex no path
        Assert.IsTrue(capturedPath.EndsWith(SampleHex), $"Expected hex in path, got: {capturedPath}");
    }
}

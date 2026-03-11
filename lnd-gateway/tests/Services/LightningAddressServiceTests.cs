using System.Net;
using System.Text;
using System.Text.Json;
using lnd_gateway.Services;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Moq.Protected;

namespace tests.Services;

[TestClass]
public class LightningAddressServiceTests
{
    private Mock<HttpMessageHandler> _handlerMock = null!;
    private LightningAddressService _service = null!;

    [TestInitialize]
    public void Init()
    {
        _handlerMock = new Mock<HttpMessageHandler>();
        var client = new HttpClient(_handlerMock.Object);
        _service = new LightningAddressService(client, NullLogger<LightningAddressService>.Instance);
    }

    private void SetupResponse(string url, HttpStatusCode status, object body)
    {
        var json = JsonSerializer.Serialize(body);
        _handlerMock.Protected()
            .Setup<Task<HttpResponseMessage>>("SendAsync",
                ItExpr.Is<HttpRequestMessage>(r => r.RequestUri!.ToString().StartsWith(url)),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(new HttpResponseMessage(status)
            {
                Content = new StringContent(json, Encoding.UTF8, "application/json")
            });
    }

    private void SetupLnurlSuccess(string domain, string user, string callback, long minMsats, long maxMsats, string bolt11)
    {
        SetupResponse($"https://{domain}/.well-known/lnurlp/{user}", HttpStatusCode.OK, new
        {
            callback,
            minSendable = minMsats,
            maxSendable = maxMsats,
            tag = "payRequest"
        });
        SetupResponse(callback, HttpStatusCode.OK, new { pr = bolt11 });
    }

    // ── Happy path ──────────────────────────────────────────────────────────

    [TestMethod]
    public async Task GetInvoiceAsync_ReturnsBolt11_WhenAddressValid()
    {
        SetupLnurlSuccess("walletofsatoshi.com", "user", "https://walletofsatoshi.com/pay", 1000, 1_000_000_000, "lnbc1000n1...");

        var result = await _service.GetInvoiceAsync("user@walletofsatoshi.com", 1000);

        Assert.IsTrue(result.Success);
        Assert.AreEqual("lnbc1000n1...", result.Value);
    }

    [TestMethod]
    public async Task GetInvoiceAsync_SendsCorrectAmountInMillisats()
    {
        string? capturedUrl = null;
        // 1ª chamada: metadata
        _handlerMock.Protected()
            .Setup<Task<HttpResponseMessage>>("SendAsync",
                ItExpr.Is<HttpRequestMessage>(r => r.RequestUri!.AbsolutePath.Contains("lnurlp")),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(
                    JsonSerializer.Serialize(new { callback = "https://pay.domain.com/cb", minSendable = 1000, maxSendable = 1_000_000_000, tag = "payRequest" }),
                    Encoding.UTF8, "application/json")
            });
        // 2ª chamada: callback — captura URL
        _handlerMock.Protected()
            .Setup<Task<HttpResponseMessage>>("SendAsync",
                ItExpr.Is<HttpRequestMessage>(r => r.RequestUri!.Host == "pay.domain.com"),
                ItExpr.IsAny<CancellationToken>())
            .Callback<HttpRequestMessage, CancellationToken>((req, _) => capturedUrl = req.RequestUri!.ToString())
            .ReturnsAsync(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(JsonSerializer.Serialize(new { pr = "lnbc..." }), Encoding.UTF8, "application/json")
            });

        await _service.GetInvoiceAsync("user@domain.com", 2500);

        Assert.IsNotNull(capturedUrl);
        StringAssert.Contains(capturedUrl, "amount=2500000"); // 2500 sats × 1000 = 2.500.000 msats
    }

    // ── Validação de formato ─────────────────────────────────────────────────

    [TestMethod]
    public async Task GetInvoiceAsync_ReturnsFail_WhenAddressMissingAt()
    {
        var result = await _service.GetInvoiceAsync("invalidemail", 1000);

        Assert.IsFalse(result.Success);
        StringAssert.Contains(result.Error!, "Invalid Lightning Address");
    }

    [TestMethod]
    public async Task GetInvoiceAsync_ReturnsFail_WhenAddressStartsWithAt()
    {
        var result = await _service.GetInvoiceAsync("@domain.com", 1000);

        Assert.IsFalse(result.Success);
        StringAssert.Contains(result.Error!, "Invalid Lightning Address");
    }

    // ── Validação de amount ──────────────────────────────────────────────────

    [TestMethod]
    public async Task GetInvoiceAsync_ReturnsFail_WhenAmountBelowMin()
    {
        SetupResponse("https://domain.com/.well-known/lnurlp/user", HttpStatusCode.OK, new
        {
            callback = "https://domain.com/pay",
            minSendable = 10_000L,   // min 10 sats
            maxSendable = 1_000_000_000L,
            tag = "payRequest"
        });

        var result = await _service.GetInvoiceAsync("user@domain.com", 5); // 5 sats < 10 sats min

        Assert.IsFalse(result.Success);
        StringAssert.Contains(result.Error!, "out of range");
    }

    [TestMethod]
    public async Task GetInvoiceAsync_ReturnsFail_WhenAmountAboveMax()
    {
        SetupResponse("https://domain.com/.well-known/lnurlp/user", HttpStatusCode.OK, new
        {
            callback = "https://domain.com/pay",
            minSendable = 1000L,
            maxSendable = 100_000L,  // max 100 sats
            tag = "payRequest"
        });

        var result = await _service.GetInvoiceAsync("user@domain.com", 200); // 200 sats > 100 sats max

        Assert.IsFalse(result.Success);
        StringAssert.Contains(result.Error!, "out of range");
    }

    // ── Erros de rede / servidor ─────────────────────────────────────────────

    [TestMethod]
    public async Task GetInvoiceAsync_ReturnsFail_WhenMetadataEndpointNotFound()
    {
        SetupResponse("https://notfound.com/.well-known/lnurlp/user", HttpStatusCode.NotFound, new { });

        var result = await _service.GetInvoiceAsync("user@notfound.com", 1000);

        Assert.IsFalse(result.Success);
        StringAssert.Contains(result.Error!, "Lightning Address not found");
    }

    [TestMethod]
    public async Task GetInvoiceAsync_ReturnsFail_WhenTagIsNotPayRequest()
    {
        SetupResponse("https://domain.com/.well-known/lnurlp/user", HttpStatusCode.OK, new
        {
            callback = "https://domain.com/pay",
            minSendable = 1000L,
            maxSendable = 1_000_000_000L,
            tag = "channelRequest"  // tipo errado
        });

        var result = await _service.GetInvoiceAsync("user@domain.com", 1000);

        Assert.IsFalse(result.Success);
        StringAssert.Contains(result.Error!, "Invalid LNURL-pay");
    }

    [TestMethod]
    public async Task GetInvoiceAsync_ReturnsFail_WhenCallbackReturnsEmptyInvoice()
    {
        SetupLnurlSuccess("domain.com", "user", "https://domain.com/pay", 1000, 1_000_000_000, "");

        var result = await _service.GetInvoiceAsync("user@domain.com", 1000);

        Assert.IsFalse(result.Success);
        StringAssert.Contains(result.Error!, "Empty invoice");
    }

    [TestMethod]
    public async Task GetInvoiceAsync_ReturnsFail_WhenHttpThrows()
    {
        _handlerMock.Protected()
            .Setup<Task<HttpResponseMessage>>("SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .ThrowsAsync(new HttpRequestException("network error"));

        var result = await _service.GetInvoiceAsync("user@domain.com", 1000);

        Assert.IsFalse(result.Success);
        StringAssert.Contains(result.Error!, "network error");
    }
}

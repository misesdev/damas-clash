using lnd_gateway.Controllers;
using lnd_gateway.Models;
using lnd_gateway.Services;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace tests.Controllers;

/// <summary>
/// Unit tests for WalletController — isolated from HTTP pipeline via direct instantiation.
/// </summary>
[TestClass]
public class WalletControllerTests
{
    private Mock<ILndService> _lndMock = null!;
    private Mock<ILightningAddressService> _laMock = null!;
    private WalletController _controller = null!;

    [TestInitialize]
    public void Init()
    {
        _lndMock = new Mock<ILndService>();
        _laMock  = new Mock<ILightningAddressService>();
        _controller = new WalletController(_lndMock.Object, _laMock.Object);
    }

    // ── Deposit ─────────────────────────────────────────────────────────────────

    [TestMethod]
    public async Task Deposit_Returns200_WhenLndSucceeds()
    {
        var expected = new DepositResponse("lnbc1000n1...", "abc123hex", 9999999999L);
        _lndMock
            .Setup(s => s.CreateInvoiceAsync(1000, "test", default))
            .ReturnsAsync(ServiceResult<DepositResponse>.Ok(expected));

        var result = await _controller.Deposit(new DepositRequest(1000, "test"), default);

        var ok = result as OkObjectResult;
        Assert.IsNotNull(ok);
        Assert.AreEqual(expected, ok.Value);
    }

    [TestMethod]
    public async Task Deposit_Returns400_WhenLndFails()
    {
        _lndMock
            .Setup(s => s.CreateInvoiceAsync(It.IsAny<long>(), It.IsAny<string?>(), default))
            .ReturnsAsync(ServiceResult<DepositResponse>.Fail("LND error: 500"));

        var result = await _controller.Deposit(new DepositRequest(500, null), default);

        Assert.IsInstanceOfType<BadRequestObjectResult>(result);
    }

    [TestMethod]
    public async Task Deposit_PassesMemoToService()
    {
        _lndMock
            .Setup(s => s.CreateInvoiceAsync(2000, "my memo", default))
            .ReturnsAsync(ServiceResult<DepositResponse>.Ok(new DepositResponse("lnbc...", "hexhash", 0)));

        await _controller.Deposit(new DepositRequest(2000, "my memo"), default);

        _lndMock.Verify(s => s.CreateInvoiceAsync(2000, "my memo", default), Times.Once);
    }

    [TestMethod]
    public async Task Deposit_PassesNullMemo_WhenNotProvided()
    {
        _lndMock
            .Setup(s => s.CreateInvoiceAsync(It.IsAny<long>(), null, default))
            .ReturnsAsync(ServiceResult<DepositResponse>.Ok(new DepositResponse("lnbc...", "hexhash", 0)));

        var result = await _controller.Deposit(new DepositRequest(100, null), default);

        _lndMock.Verify(s => s.CreateInvoiceAsync(100, null, default), Times.Once);
        Assert.IsInstanceOfType<OkObjectResult>(result);
    }

    // ── Withdraw (BOLT11) ─────────────────────────────────────────────────────

    [TestMethod]
    public async Task Withdraw_Returns200_WhenPaymentSucceeds()
    {
        var expected = new WithdrawResponse("payhashHex", "preimageHex", 5L);
        _lndMock
            .Setup(s => s.PayInvoiceAsync("lnbc...", null, default))
            .ReturnsAsync(ServiceResult<WithdrawResponse>.Ok(expected));

        var result = await _controller.Withdraw(new WithdrawRequest("lnbc...", null), default);

        var ok = result as OkObjectResult;
        Assert.IsNotNull(ok);
        Assert.AreEqual(expected, ok.Value);
    }

    [TestMethod]
    public async Task Withdraw_Returns400_WhenPaymentFails()
    {
        _lndMock
            .Setup(s => s.PayInvoiceAsync(It.IsAny<string>(), It.IsAny<long?>(), default))
            .ReturnsAsync(ServiceResult<WithdrawResponse>.Fail("insufficient funds"));

        var result = await _controller.Withdraw(new WithdrawRequest("lnbc...", null), default);

        Assert.IsInstanceOfType<BadRequestObjectResult>(result);
    }

    [TestMethod]
    public async Task Withdraw_PassesMaxFeeSats_ToService()
    {
        _lndMock
            .Setup(s => s.PayInvoiceAsync("lnbc...", 20L, default))
            .ReturnsAsync(ServiceResult<WithdrawResponse>.Ok(new WithdrawResponse("h", "p", 0)));

        await _controller.Withdraw(new WithdrawRequest("lnbc...", 20L), default);

        _lndMock.Verify(s => s.PayInvoiceAsync("lnbc...", 20L, default), Times.Once);
    }

    [TestMethod]
    public async Task Withdraw_Returns400_WithErrorMessage_WhenLndFails()
    {
        _lndMock
            .Setup(s => s.PayInvoiceAsync(It.IsAny<string>(), It.IsAny<long?>(), default))
            .ReturnsAsync(ServiceResult<WithdrawResponse>.Fail("no route found"));

        var result = await _controller.Withdraw(new WithdrawRequest("lnbc...", null), default) as BadRequestObjectResult;

        Assert.IsNotNull(result);
        StringAssert.Contains(result.Value!.ToString(), "no route found");
    }

    // ── WithdrawToAddress (Lightning Address) ─────────────────────────────────

    [TestMethod]
    public async Task WithdrawToAddress_Returns200_WhenSuccess()
    {
        var bolt11 = "lnbc1000n1_resolved_invoice";
        var expected = new WithdrawResponse("payhashHex", "preimageHex", 3L);

        _laMock
            .Setup(s => s.GetInvoiceAsync("user@domain.com", 1000, default))
            .ReturnsAsync(ServiceResult<string>.Ok(bolt11));
        _lndMock
            .Setup(s => s.PayInvoiceAsync(bolt11, null, default))
            .ReturnsAsync(ServiceResult<WithdrawResponse>.Ok(expected));

        var result = await _controller.WithdrawToAddress(
            new WithdrawToAddressRequest("user@domain.com", 1000, null), default);

        var ok = result as OkObjectResult;
        Assert.IsNotNull(ok);
        Assert.AreEqual(expected, ok.Value);
    }

    [TestMethod]
    public async Task WithdrawToAddress_Returns400_WhenAddressResolutionFails()
    {
        _laMock
            .Setup(s => s.GetInvoiceAsync(It.IsAny<string>(), It.IsAny<long>(), default))
            .ReturnsAsync(ServiceResult<string>.Fail("Lightning Address not found: bad@invalid.com"));

        var result = await _controller.WithdrawToAddress(
            new WithdrawToAddressRequest("bad@invalid.com", 500, null), default);

        Assert.IsInstanceOfType<BadRequestObjectResult>(result);
        _lndMock.Verify(s => s.PayInvoiceAsync(It.IsAny<string>(), It.IsAny<long?>(), default), Times.Never);
    }

    [TestMethod]
    public async Task WithdrawToAddress_Returns400_WhenPaymentFails()
    {
        _laMock
            .Setup(s => s.GetInvoiceAsync(It.IsAny<string>(), It.IsAny<long>(), default))
            .ReturnsAsync(ServiceResult<string>.Ok("lnbc..."));
        _lndMock
            .Setup(s => s.PayInvoiceAsync(It.IsAny<string>(), It.IsAny<long?>(), default))
            .ReturnsAsync(ServiceResult<WithdrawResponse>.Fail("no route found"));

        var result = await _controller.WithdrawToAddress(
            new WithdrawToAddressRequest("user@domain.com", 500, null), default);

        Assert.IsInstanceOfType<BadRequestObjectResult>(result);
    }

    [TestMethod]
    public async Task WithdrawToAddress_PassesMaxFeeSats_ToPayment()
    {
        _laMock
            .Setup(s => s.GetInvoiceAsync(It.IsAny<string>(), It.IsAny<long>(), default))
            .ReturnsAsync(ServiceResult<string>.Ok("lnbc..."));
        _lndMock
            .Setup(s => s.PayInvoiceAsync("lnbc...", 15L, default))
            .ReturnsAsync(ServiceResult<WithdrawResponse>.Ok(new WithdrawResponse("h", "p", 0)));

        await _controller.WithdrawToAddress(
            new WithdrawToAddressRequest("user@domain.com", 500, 15L), default);

        _lndMock.Verify(s => s.PayInvoiceAsync("lnbc...", 15L, default), Times.Once);
    }

    // ── GetInvoiceStatus ─────────────────────────────────────────────────────

    [TestMethod]
    public async Task GetInvoiceStatus_Returns200_WhenInvoiceFound()
    {
        var expected = new InvoiceStatusResponse("hexhash1", "SETTLED", true, 1000, 1000, "game bet");
        _lndMock
            .Setup(s => s.GetInvoiceAsync("hexhash1", default))
            .ReturnsAsync(ServiceResult<InvoiceStatusResponse>.Ok(expected));

        var result = await _controller.GetInvoiceStatus("hexhash1", default);

        var ok = result as OkObjectResult;
        Assert.IsNotNull(ok);
        Assert.AreEqual(expected, ok.Value);
    }

    [TestMethod]
    public async Task GetInvoiceStatus_Returns404_WhenInvoiceNotFound()
    {
        _lndMock
            .Setup(s => s.GetInvoiceAsync(It.IsAny<string>(), default))
            .ReturnsAsync(ServiceResult<InvoiceStatusResponse>.Fail("Invoice not found"));

        var result = await _controller.GetInvoiceStatus("unknown", default);

        Assert.IsInstanceOfType<NotFoundObjectResult>(result);
    }

    [TestMethod]
    public async Task GetInvoiceStatus_Returns400_WhenLndFails()
    {
        _lndMock
            .Setup(s => s.GetInvoiceAsync(It.IsAny<string>(), default))
            .ReturnsAsync(ServiceResult<InvoiceStatusResponse>.Fail("LND error: InternalServerError"));

        var result = await _controller.GetInvoiceStatus("hexhash1", default);

        Assert.IsInstanceOfType<BadRequestObjectResult>(result);
    }

    [TestMethod]
    public async Task GetInvoiceStatus_ReturnsOpenState_WhenNotYetPaid()
    {
        var open = new InvoiceStatusResponse("hexhash1", "OPEN", false, 1000, 0, "");
        _lndMock
            .Setup(s => s.GetInvoiceAsync("hexhash1", default))
            .ReturnsAsync(ServiceResult<InvoiceStatusResponse>.Ok(open));

        var result = await _controller.GetInvoiceStatus("hexhash1", default) as OkObjectResult;
        var status = result?.Value as InvoiceStatusResponse;

        Assert.IsNotNull(status);
        Assert.IsFalse(status.Settled);
        Assert.AreEqual("OPEN", status.State);
    }
}

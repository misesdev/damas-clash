using lnd_gateway.Models;
using lnd_gateway.Services;
using Microsoft.AspNetCore.Mvc;

namespace lnd_gateway.Controllers;

[ApiController]
[Route("api/wallet")]
public class WalletController : ControllerBase
{
    private readonly ILndService _lndService;
    private readonly ILightningAddressService _lightningAddressService;

    public WalletController(ILndService lndService, ILightningAddressService lightningAddressService)
    {
        _lndService = lndService;
        _lightningAddressService = lightningAddressService;
    }

    /// <summary>
    /// Creates a Lightning invoice to receive funds (deposit).
    /// </summary>
    [HttpPost("deposit")]
    [ProducesResponseType(typeof(DepositResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Deposit([FromBody] DepositRequest request, CancellationToken ct)
    {
        var result = await _lndService.CreateInvoiceAsync(request.AmountSats, request.Memo, ct);
        return result.Success
            ? Ok(result.Value)
            : BadRequest(new { error = result.Error });
    }

    /// <summary>
    /// Verifica o status de um invoice (se foi pago ou não).
    /// Use o rHash (hex) retornado pelo endpoint de deposit.
    /// </summary>
    [HttpGet("invoice/{rHash}")]
    [ProducesResponseType(typeof(InvoiceStatusResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetInvoiceStatus([FromRoute] string rHash, CancellationToken ct)
    {
        var result = await _lndService.GetInvoiceAsync(rHash, ct);

        if (!result.Success && result.Error == "Invoice not found")
            return NotFound(new { error = result.Error });

        return result.Success
            ? Ok(result.Value)
            : BadRequest(new { error = result.Error });
    }

    /// <summary>
    /// Paga um invoice BOLT11 diretamente (withdraw).
    /// </summary>
    [HttpPost("withdraw")]
    [ProducesResponseType(typeof(WithdrawResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Withdraw([FromBody] WithdrawRequest request, CancellationToken ct)
    {
        var result = await _lndService.PayInvoiceAsync(request.PaymentRequest, request.MaxFeeSats, ct);
        return result.Success
            ? Ok(result.Value)
            : BadRequest(new { error = result.Error });
    }

    /// <summary>
    /// Envia sats para uma Lightning Address (ex: user@walletofsatoshi.com).
    /// Resolve via LNURL-pay e paga o invoice gerado automaticamente.
    /// </summary>
    [HttpPost("withdraw/address")]
    [ProducesResponseType(typeof(WithdrawResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> WithdrawToAddress([FromBody] WithdrawToAddressRequest request, CancellationToken ct)
    {
        // Passo 1: resolve Lightning Address → BOLT11 invoice
        var invoiceResult = await _lightningAddressService.GetInvoiceAsync(request.LightningAddress, request.AmountSats, ct);
        if (!invoiceResult.Success)
            return BadRequest(new { error = invoiceResult.Error });

        // Passo 2: paga o invoice via LND
        var payResult = await _lndService.PayInvoiceAsync(invoiceResult.Value!, request.MaxFeeSats, ct);
        return payResult.Success
            ? Ok(payResult.Value)
            : BadRequest(new { error = payResult.Error });
    }
}

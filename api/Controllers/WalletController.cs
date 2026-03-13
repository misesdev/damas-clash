using System.Security.Claims;
using api.DTOs.Wallet;
using api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers;

[ApiController]
[Route("api/wallet")]
[Authorize]
public class WalletController(IWalletService walletService, ILightningService lightningService) : ControllerBase
{
    private Guid PlayerId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    /// <summary>GET /api/wallet — get current wallet balance.</summary>
    [HttpGet]
    public async Task<IActionResult> GetWallet(CancellationToken ct)
    {
        var wallet = await walletService.GetOrCreateAsync(PlayerId, ct);
        return Ok(wallet);
    }

    /// <summary>GET /api/wallet/transactions — ledger history.</summary>
    [HttpGet("transactions")]
    public async Task<IActionResult> GetTransactions(CancellationToken ct)
    {
        var entries = await walletService.GetTransactionsAsync(PlayerId, ct);
        return Ok(entries);
    }

    /// <summary>POST /api/wallet/deposit — create a Lightning invoice to deposit sats.</summary>
    [HttpPost("deposit")]
    public async Task<IActionResult> Deposit([FromBody] DepositRequest request, CancellationToken ct)
    {
        var result = await lightningService.InitiateDepositAsync(PlayerId, request.AmountSats, request.Memo, ct);
        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });
        return Ok(result.Value);
    }

    /// <summary>GET /api/wallet/deposit/{rHash}/status — poll deposit status; credits wallet if paid.</summary>
    [HttpGet("deposit/{rHash}/status")]
    public async Task<IActionResult> DepositStatus(string rHash, CancellationToken ct)
    {
        var result = await lightningService.CheckDepositAsync(PlayerId, rHash, ct);
        if (!result.IsSuccess)
        {
            if (result.IsNotFound) return NotFound(new { error = result.Error });
            return BadRequest(new { error = result.Error });
        }
        return Ok(result.Value);
    }

    /// <summary>POST /api/wallet/withdraw-to-address — withdraw to the player's registered Lightning Address.</summary>
    [HttpPost("withdraw-to-address")]
    public async Task<IActionResult> WithdrawToAddress([FromBody] WithdrawToAddressRequest request, CancellationToken ct)
    {
        var result = await lightningService.WithdrawToAddressAsync(
            PlayerId, request.AmountSats, request.MaxFeeSats, ct);

        if (!result.IsSuccess)
        {
            if (result.IsNotFound) return NotFound(new { error = result.Error });
            return result.Error switch
            {
                "no_lightning_address" => BadRequest(new { error = result.Error }),
                "insufficient_balance" => BadRequest(new { error = result.Error }),
                "amount_out_of_range" => BadRequest(new { error = result.Error }),
                _ => UnprocessableEntity(new { error = result.Error })
            };
        }

        return Ok(result.Value);
    }

    /// <summary>POST /api/wallet/withdraw — pay a Lightning invoice (withdraw sats).</summary>
    [HttpPost("withdraw")]
    public async Task<IActionResult> Withdraw([FromBody] WithdrawRequest request, CancellationToken ct)
    {
        var result = await lightningService.WithdrawAsync(
            PlayerId, request.Invoice, request.AmountSats, request.MaxFeeSats, ct);

        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });

        return Ok(result.Value);
    }
}

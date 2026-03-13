using System.Collections.Concurrent;
using api.Data;
using api.DTOs.Wallet;
using api.Models;
using api.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace api.Services;

public class LightningService(
    DamasDbContext db,
    ILightningGatewayService gateway,
    IWalletService wallet,
    ILightningAddressValidator lnurlValidator) : ILightningService
{
    // Per-payment semaphore ensures that concurrent polls for the same payment
    // cannot both pass the Status == Pending check simultaneously.
    // This prevents double-credit within a single API instance.
    private static readonly ConcurrentDictionary<Guid, SemaphoreSlim> _depositLocks = new();
    public async Task<ServiceResult<DepositInitiatedResponse>> InitiateDepositAsync(
        Guid playerId, long amountSats, string? memo, CancellationToken ct = default)
    {
        var gatewayResult = await gateway.CreateInvoiceAsync(amountSats, memo, ct);
        if (!gatewayResult.IsSuccess)
            return ServiceResult<DepositInitiatedResponse>.Fail(gatewayResult.Error!);

        var g = gatewayResult.Value!;

        var payment = new LightningPayment
        {
            Id = Guid.NewGuid(),
            PlayerId = playerId,
            PaymentHash = g.RHash,
            Invoice = g.Invoice,
            AmountSats = amountSats,
            Status = PaymentStatus.Pending,
            Direction = PaymentDirection.Incoming,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        db.LightningPayments.Add(payment);
        await db.SaveChangesAsync(ct);

        return ServiceResult<DepositInitiatedResponse>.Ok(
            new DepositInitiatedResponse(payment.Id, g.Invoice, g.RHash, g.ExpiresAt));
    }

    public async Task<ServiceResult<DepositStatusResponse>> CheckDepositAsync(
        Guid playerId, string rHash, CancellationToken ct = default)
    {
        var payment = await db.LightningPayments
            .FirstOrDefaultAsync(p => p.PlayerId == playerId && p.PaymentHash == rHash, ct);

        if (payment is null)
            return ServiceResult<DepositStatusResponse>.NotFound("Payment not found");

        // Already credited
        if (payment.Status == PaymentStatus.Paid)
            return ServiceResult<DepositStatusResponse>.Ok(
                new DepositStatusResponse("Paid", payment.AmountSats, Credited: true));

        if (payment.Status == PaymentStatus.Failed)
            return ServiceResult<DepositStatusResponse>.Ok(
                new DepositStatusResponse("Failed", payment.AmountSats, Credited: false));

        // Check with gateway
        var statusResult = await gateway.GetInvoiceStatusAsync(rHash, ct);
        if (!statusResult.IsSuccess)
            return ServiceResult<DepositStatusResponse>.Fail(statusResult.Error!);

        var status = statusResult.Value!;

        if (status.Settled)
        {
            var amountPaid = status.AmountPaidSats > 0 ? status.AmountPaidSats : payment.AmountSats;
            return await CreditDepositAtomicAsync(playerId, payment, amountPaid, ct);
        }

        return ServiceResult<DepositStatusResponse>.Ok(
            new DepositStatusResponse(status.State, payment.AmountSats, Credited: false));
    }

    /// <summary>
    /// Acquires a per-payment in-process lock, reloads the payment to see the latest
    /// committed state, and credits the wallet only if the payment is still Pending.
    /// This prevents double-credit from concurrent mobile polls within the same instance.
    /// </summary>
    private async Task<ServiceResult<DepositStatusResponse>> CreditDepositAtomicAsync(
        Guid playerId, LightningPayment payment, long amountPaid, CancellationToken ct)
    {
        var sem = _depositLocks.GetOrAdd(payment.Id, _ => new SemaphoreSlim(1, 1));
        await sem.WaitAsync(ct);
        try
        {
            // Reload so we see any update committed by a concurrent request
            await db.Entry(payment).ReloadAsync(ct);

            if (payment.Status != PaymentStatus.Pending)
            {
                return ServiceResult<DepositStatusResponse>.Ok(
                    new DepositStatusResponse("Paid", payment.AmountSats, Credited: true));
            }

            // Mark as Paid before crediting so that a failure in CreditAsync
            // does not leave a Pending payment that could be re-credited later.
            payment.Status = PaymentStatus.Paid;
            payment.AmountSats = amountPaid;
            payment.UpdatedAt = DateTimeOffset.UtcNow;
            await db.SaveChangesAsync(ct);

            var creditResult = await wallet.CreditAsync(
                playerId, amountPaid, LedgerEntryType.Deposit, paymentId: payment.Id, ct: ct);

            if (!creditResult.IsSuccess)
                return ServiceResult<DepositStatusResponse>.Fail(creditResult.Error!);

            return ServiceResult<DepositStatusResponse>.Ok(
                new DepositStatusResponse("Paid", amountPaid, Credited: true));
        }
        finally
        {
            sem.Release();
            // Remove the semaphore once the payment has left the Pending state
            if (payment.Status != PaymentStatus.Pending)
                _depositLocks.TryRemove(payment.Id, out _);
        }
    }

    public async Task<ServiceResult<WithdrawResponse>> WithdrawAsync(
        Guid playerId, string invoice, long amountSats, long maxFeeSats, CancellationToken ct = default)
    {
        // Check sufficient balance (including max fee buffer)
        var walletData = await wallet.GetOrCreateAsync(playerId, ct);
        if (walletData.AvailableBalanceSats < amountSats + maxFeeSats)
            return ServiceResult<WithdrawResponse>.Fail("Insufficient balance");

        // Create pending outgoing payment record
        var payment = new LightningPayment
        {
            Id = Guid.NewGuid(),
            PlayerId = playerId,
            PaymentHash = string.Empty,
            Invoice = invoice,
            AmountSats = amountSats,
            Status = PaymentStatus.Pending,
            Direction = PaymentDirection.Outgoing,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
        db.LightningPayments.Add(payment);
        await db.SaveChangesAsync(ct);

        // Execute payment through gateway
        var payResult = await gateway.PayInvoiceAsync(invoice, maxFeeSats, ct);
        if (!payResult.IsSuccess)
        {
            payment.Status = PaymentStatus.Failed;
            payment.UpdatedAt = DateTimeOffset.UtcNow;
            await db.SaveChangesAsync(ct);
            return ServiceResult<WithdrawResponse>.Fail(payResult.Error!);
        }

        var g = payResult.Value!;
        var totalDeducted = amountSats + g.FeePaidSats;

        // Debit wallet
        var debitResult = await wallet.DebitAsync(
            playerId, totalDeducted, LedgerEntryType.Withdrawal,
            paymentId: payment.Id, ct: ct);

        if (!debitResult.IsSuccess)
        {
            // This shouldn't happen (we checked balance above), but handle defensively
            payment.Status = PaymentStatus.Failed;
            payment.UpdatedAt = DateTimeOffset.UtcNow;
            await db.SaveChangesAsync(ct);
            return ServiceResult<WithdrawResponse>.Fail(debitResult.Error!);
        }

        payment.PaymentHash = g.PaymentHash;
        payment.AmountSats = totalDeducted;
        payment.Status = PaymentStatus.Paid;
        payment.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);

        return ServiceResult<WithdrawResponse>.Ok(
            new WithdrawResponse(g.PaymentHash, amountSats, g.FeePaidSats));
    }

    public async Task<ServiceResult<WithdrawResponse>> WithdrawToAddressAsync(
        Guid playerId, long amountSats, long maxFeeSats, CancellationToken ct = default)
    {
        var player = await db.Players.FindAsync([playerId], ct);
        if (player is null)
            return ServiceResult<WithdrawResponse>.NotFound("player_not_found");

        if (string.IsNullOrEmpty(player.LightningAddress))
            return ServiceResult<WithdrawResponse>.Fail("no_lightning_address");

        // Check balance up-front
        var walletData = await wallet.GetOrCreateAsync(playerId, ct);
        if (walletData.AvailableBalanceSats < amountSats + maxFeeSats)
            return ServiceResult<WithdrawResponse>.Fail("insufficient_balance");

        // Resolve LNURL pay info
        var lnurlResult = await lnurlValidator.ValidateAsync(player.LightningAddress, ct);
        if (!lnurlResult.IsSuccess)
            return ServiceResult<WithdrawResponse>.Fail(lnurlResult.Error!);

        var payInfo = lnurlResult.Value!;
        var amountMsats = amountSats * 1000;
        if (amountMsats < payInfo.MinSendable || amountMsats > payInfo.MaxSendable)
            return ServiceResult<WithdrawResponse>.Fail("amount_out_of_range");

        // Fetch invoice from recipient's LNURL callback
        var invoiceResult = await lnurlValidator.FetchInvoiceAsync(payInfo.Callback, amountMsats, ct);
        if (!invoiceResult.IsSuccess)
            return ServiceResult<WithdrawResponse>.Fail(invoiceResult.Error!);

        return await WithdrawAsync(playerId, invoiceResult.Value!, amountSats, maxFeeSats, ct);
    }
}

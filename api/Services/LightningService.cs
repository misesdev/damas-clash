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
            // Credit wallet
            var creditResult = await wallet.CreditAsync(
                playerId, status.AmountPaidSats > 0 ? status.AmountPaidSats : payment.AmountSats,
                LedgerEntryType.Deposit, paymentId: payment.Id, ct: ct);

            if (!creditResult.IsSuccess)
                return ServiceResult<DepositStatusResponse>.Fail(creditResult.Error!);

            payment.Status = PaymentStatus.Paid;
            payment.UpdatedAt = DateTimeOffset.UtcNow;
            await db.SaveChangesAsync(ct);

            return ServiceResult<DepositStatusResponse>.Ok(
                new DepositStatusResponse("Paid", payment.AmountSats, Credited: true));
        }

        return ServiceResult<DepositStatusResponse>.Ok(
            new DepositStatusResponse(status.State, payment.AmountSats, Credited: false));
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

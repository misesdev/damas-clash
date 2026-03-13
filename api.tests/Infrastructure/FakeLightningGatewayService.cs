using api.Models;
using api.Services;

namespace api.tests.Infrastructure;

/// <summary>
/// In-memory stub for ILightningGatewayService. Tests can configure responses
/// before calling API endpoints.
/// </summary>
public class FakeLightningGatewayService : ILightningGatewayService
{
    public string? InvoiceToReturn { get; set; } = "lnbcrt1_test_invoice";
    public string? RHashToReturn { get; set; } = "aabbccdd";
    public long ExpiresAtToReturn { get; set; } = DateTimeOffset.UtcNow.AddHours(1).ToUnixTimeSeconds();
    public bool ShouldInvoiceBeSettled { get; set; } = false;
    public string? PaymentHashToReturn { get; set; } = "pay_hash_001";
    public long FeePaidSatsToReturn { get; set; } = 1;
    public bool ShouldPaymentFail { get; set; } = false;

    public Task<ServiceResult<GatewayDepositResponse>> CreateInvoiceAsync(
        long amountSats, string? memo, CancellationToken ct = default)
    {
        var result = ServiceResult<GatewayDepositResponse>.Ok(
            new GatewayDepositResponse(InvoiceToReturn!, RHashToReturn!, ExpiresAtToReturn));
        return Task.FromResult(result);
    }

    public Task<ServiceResult<GatewayInvoiceStatus>> GetInvoiceStatusAsync(
        string rHash, CancellationToken ct = default)
    {
        var result = ServiceResult<GatewayInvoiceStatus>.Ok(
            new GatewayInvoiceStatus(
                ShouldInvoiceBeSettled ? "SETTLED" : "OPEN",
                ShouldInvoiceBeSettled,
                1000,
                ShouldInvoiceBeSettled ? 1000 : 0));
        return Task.FromResult(result);
    }

    public Task<ServiceResult<GatewayWithdrawResponse>> PayInvoiceAsync(
        string invoice, long maxFeeSats, CancellationToken ct = default)
    {
        if (ShouldPaymentFail)
            return Task.FromResult(ServiceResult<GatewayWithdrawResponse>.Fail("Payment failed"));

        return Task.FromResult(ServiceResult<GatewayWithdrawResponse>.Ok(
            new GatewayWithdrawResponse(PaymentHashToReturn!, FeePaidSatsToReturn)));
    }
}

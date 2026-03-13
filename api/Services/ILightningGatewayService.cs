using api.Models;

namespace api.Services;

public record GatewayDepositResponse(string Invoice, string RHash, long ExpiresAt);
public record GatewayInvoiceStatus(string State, bool Settled, long AmountSats, long AmountPaidSats);
public record GatewayWithdrawResponse(string PaymentHash, long FeePaidSats);

public interface ILightningGatewayService
{
    Task<ServiceResult<GatewayDepositResponse>> CreateInvoiceAsync(long amountSats, string? memo, CancellationToken ct = default);
    Task<ServiceResult<GatewayInvoiceStatus>> GetInvoiceStatusAsync(string rHash, CancellationToken ct = default);
    Task<ServiceResult<GatewayWithdrawResponse>> PayInvoiceAsync(string invoice, long maxFeeSats, CancellationToken ct = default);
}

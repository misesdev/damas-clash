using lnd_gateway.Models;

namespace lnd_gateway.Services;

public interface ILndService
{
    Task<ServiceResult<DepositResponse>> CreateInvoiceAsync(long amountSats, string? memo, CancellationToken ct = default);
    Task<ServiceResult<WithdrawResponse>> PayInvoiceAsync(string paymentRequest, long? maxFeeSats, CancellationToken ct = default);
    Task<ServiceResult<InvoiceStatusResponse>> GetInvoiceAsync(string rHash, CancellationToken ct = default);
}

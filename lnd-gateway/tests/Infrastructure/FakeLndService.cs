using lnd_gateway.Models;
using lnd_gateway.Services;

namespace tests.Infrastructure;

public class FakeLndService : ILndService
{
    private ServiceResult<DepositResponse> _depositResult =
        ServiceResult<DepositResponse>.Ok(new DepositResponse("lnbc1...", "hash_default", DateTimeOffset.UtcNow.AddHours(1).ToUnixTimeSeconds()));

    private ServiceResult<WithdrawResponse> _withdrawResult =
        ServiceResult<WithdrawResponse>.Ok(new WithdrawResponse("payhash_default", "preimage_default", 1));

    private ServiceResult<InvoiceStatusResponse> _invoiceStatusResult =
        ServiceResult<InvoiceStatusResponse>.Ok(new InvoiceStatusResponse("hash_default", "OPEN", false, 1000, 0, ""));

    public void SetDepositResult(ServiceResult<DepositResponse> result) => _depositResult = result;
    public void SetWithdrawResult(ServiceResult<WithdrawResponse> result) => _withdrawResult = result;
    public void SetInvoiceStatusResult(ServiceResult<InvoiceStatusResponse> result) => _invoiceStatusResult = result;

    public Task<ServiceResult<DepositResponse>> CreateInvoiceAsync(long amountSats, string? memo, CancellationToken ct = default)
        => Task.FromResult(_depositResult);

    public Task<ServiceResult<WithdrawResponse>> PayInvoiceAsync(string paymentRequest, long? maxFeeSats, CancellationToken ct = default)
        => Task.FromResult(_withdrawResult);

    public Task<ServiceResult<InvoiceStatusResponse>> GetInvoiceAsync(string rHash, CancellationToken ct = default)
        => Task.FromResult(_invoiceStatusResult);
}

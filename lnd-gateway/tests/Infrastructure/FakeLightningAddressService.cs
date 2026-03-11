using lnd_gateway.Models;
using lnd_gateway.Services;

namespace tests.Infrastructure;

public class FakeLightningAddressService : ILightningAddressService
{
    private ServiceResult<string> _result =
        ServiceResult<string>.Ok("lnbc1000n1_fake_invoice...");

    public void SetResult(ServiceResult<string> result) => _result = result;

    public Task<ServiceResult<string>> GetInvoiceAsync(string lightningAddress, long amountSats, CancellationToken ct = default)
        => Task.FromResult(_result);
}

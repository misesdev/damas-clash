using api.Models;
using api.Services;

namespace api.tests.Infrastructure;

/// <summary>Stub that always returns success so tests don't make real HTTP calls.</summary>
public class FakeLightningAddressValidator : ILightningAddressValidator
{
    public bool ShouldFail { get; set; } = false;
    public string FailReason { get; set; } = "unreachable";

    public Task<ServiceResult<LnurlPayInfo>> ValidateAsync(string address, CancellationToken ct = default)
    {
        if (ShouldFail)
            return Task.FromResult(ServiceResult<LnurlPayInfo>.Fail(FailReason));

        return Task.FromResult(ServiceResult<LnurlPayInfo>.Ok(
            new LnurlPayInfo("https://fake.wallet/callback", 1000, 100_000_000_000)));
    }

    public Task<ServiceResult<string>> FetchInvoiceAsync(string callback, long amountMsats, CancellationToken ct = default)
    {
        if (ShouldFail)
            return Task.FromResult(ServiceResult<string>.Fail(FailReason));

        return Task.FromResult(ServiceResult<string>.Ok("lnbc_fake_invoice_for_tests"));
    }
}

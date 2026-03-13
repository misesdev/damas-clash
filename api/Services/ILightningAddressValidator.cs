using api.Models;

namespace api.Services;

public record LnurlPayInfo(string Callback, long MinSendable, long MaxSendable);

public interface ILightningAddressValidator
{
    Task<ServiceResult<LnurlPayInfo>> ValidateAsync(string address, CancellationToken ct = default);
    Task<ServiceResult<string>> FetchInvoiceAsync(string callback, long amountMsats, CancellationToken ct = default);
}

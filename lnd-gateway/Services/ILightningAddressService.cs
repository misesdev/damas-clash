using lnd_gateway.Models;

namespace lnd_gateway.Services;

public interface ILightningAddressService
{
    /// <summary>
    /// Resolve uma Lightning Address (user@domain.com) via protocolo LNURL-pay
    /// e retorna o BOLT11 invoice para o valor solicitado.
    /// </summary>
    Task<ServiceResult<string>> GetInvoiceAsync(string lightningAddress, long amountSats, CancellationToken ct = default);
}

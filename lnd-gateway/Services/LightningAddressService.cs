using System.Net.Http.Json;
using lnd_gateway.Models;
using lnd_gateway.Models.Lnd;

namespace lnd_gateway.Services;

public class LightningAddressService : ILightningAddressService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<LightningAddressService> _logger;

    public LightningAddressService(HttpClient httpClient, ILogger<LightningAddressService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<ServiceResult<string>> GetInvoiceAsync(string lightningAddress, long amountSats, CancellationToken ct = default)
    {
        // Valida formato user@domain.com
        var atIndex = lightningAddress.IndexOf('@');
        if (atIndex <= 0 || atIndex == lightningAddress.Length - 1)
            return ServiceResult<string>.Fail("Invalid Lightning Address format. Expected: user@domain.com");

        var user   = lightningAddress[..atIndex];
        var domain = lightningAddress[(atIndex + 1)..];
        var metadataUrl = $"https://{domain}/.well-known/lnurlp/{user}";

        try
        {
            // Passo 1: obtém metadados LNURL-pay
            var metaResponse = await _httpClient.GetAsync(metadataUrl, ct);
            if (!metaResponse.IsSuccessStatusCode)
            {
                _logger.LogError("LNURL metadata failed for {Address}: {Status}", lightningAddress, metaResponse.StatusCode);
                return ServiceResult<string>.Fail($"Lightning Address not found: {lightningAddress}");
            }

            var metadata = await metaResponse.Content.ReadFromJsonAsync<LnurlPayResponse>(ct);
            if (metadata is null || metadata.Tag != "payRequest")
                return ServiceResult<string>.Fail("Invalid LNURL-pay response from server");

            // Passo 2: valida amount (LND usa millisatoshis)
            var amountMsats = amountSats * 1000L;
            if (amountMsats < metadata.MinSendable || amountMsats > metadata.MaxSendable)
            {
                var minSats = metadata.MinSendable / 1000;
                var maxSats = metadata.MaxSendable / 1000;
                return ServiceResult<string>.Fail($"Amount out of range: min {minSats} sats, max {maxSats} sats");
            }

            // Passo 3: chama callback para obter o invoice BOLT11
            var callbackUrl = $"{metadata.Callback}?amount={amountMsats}";
            var callbackResponse = await _httpClient.GetAsync(callbackUrl, ct);
            if (!callbackResponse.IsSuccessStatusCode)
            {
                _logger.LogError("LNURL callback failed for {Address}: {Status}", lightningAddress, callbackResponse.StatusCode);
                return ServiceResult<string>.Fail("Failed to get invoice from Lightning Address provider");
            }

            var result = await callbackResponse.Content.ReadFromJsonAsync<LnurlCallbackResponse>(ct);
            if (result is null || string.IsNullOrEmpty(result.Pr))
                return ServiceResult<string>.Fail("Empty invoice received from Lightning Address provider");

            return ServiceResult<string>.Ok(result.Pr);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error resolving Lightning Address {Address}", lightningAddress);
            return ServiceResult<string>.Fail(ex.Message);
        }
    }
}

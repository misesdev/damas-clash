using System.Text.Json.Serialization;
using api.Models;

namespace api.Services;

public class LightningAddressValidator(HttpClient http) : ILightningAddressValidator
{
    public async Task<ServiceResult<LnurlPayInfo>> ValidateAsync(string address, CancellationToken ct = default)
    {
        var trimmed = address.Trim().ToLowerInvariant();
        var at = trimmed.IndexOf('@');
        if (at <= 0 || at == trimmed.Length - 1)
            return ServiceResult<LnurlPayInfo>.Fail("invalid_format");

        var user = trimmed[..at];
        var domain = trimmed[(at + 1)..];
        if (!domain.Contains('.'))
            return ServiceResult<LnurlPayInfo>.Fail("invalid_format");

        var url = $"https://{domain}/.well-known/lnurlp/{user}";

        HttpResponseMessage response;
        try
        {
            response = await http.GetAsync(url, ct);
        }
        catch
        {
            return ServiceResult<LnurlPayInfo>.Fail("unreachable");
        }

        if (!response.IsSuccessStatusCode)
            return ServiceResult<LnurlPayInfo>.Fail("lnurl_error");

        LnurlPayResponse? body;
        try
        {
            body = await response.Content.ReadFromJsonAsync<LnurlPayResponse>(cancellationToken: ct);
        }
        catch
        {
            return ServiceResult<LnurlPayInfo>.Fail("lnurl_error");
        }

        if (body is null || !string.Equals(body.Tag, "payRequest", StringComparison.OrdinalIgnoreCase))
            return ServiceResult<LnurlPayInfo>.Fail("not_pay_request");

        return ServiceResult<LnurlPayInfo>.Ok(
            new LnurlPayInfo(body.Callback, body.MinSendable, body.MaxSendable));
    }

    public async Task<ServiceResult<string>> FetchInvoiceAsync(string callback, long amountMsats, CancellationToken ct = default)
    {
        var sep = callback.Contains('?') ? '&' : '?';
        var url = $"{callback}{sep}amount={amountMsats}";

        HttpResponseMessage response;
        try
        {
            response = await http.GetAsync(url, ct);
        }
        catch
        {
            return ServiceResult<string>.Fail("callback_unreachable");
        }

        if (!response.IsSuccessStatusCode)
            return ServiceResult<string>.Fail("callback_error");

        LnurlCallbackResponse? body;
        try
        {
            body = await response.Content.ReadFromJsonAsync<LnurlCallbackResponse>(cancellationToken: ct);
        }
        catch
        {
            return ServiceResult<string>.Fail("callback_error");
        }

        if (body is null || string.IsNullOrEmpty(body.Pr))
            return ServiceResult<string>.Fail("no_invoice");

        return ServiceResult<string>.Ok(body.Pr);
    }

    private record LnurlCallbackResponse([property: JsonPropertyName("pr")] string Pr);

    private record LnurlPayResponse(
        [property: JsonPropertyName("tag")] string Tag,
        [property: JsonPropertyName("callback")] string Callback,
        [property: JsonPropertyName("minSendable")] long MinSendable,
        [property: JsonPropertyName("maxSendable")] long MaxSendable);
}

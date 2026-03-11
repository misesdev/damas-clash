using System.Net;
using System.Net.Http.Json;
using lnd_gateway.Models;
using lnd_gateway.Models.Lnd;

namespace lnd_gateway.Services;

public class LndService : ILndService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<LndService> _logger;

    public LndService(HttpClient httpClient, ILogger<LndService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    // LND REST API retorna r_hash em base64; converte para hex (formato do lncli).
    private static string Base64ToHex(string base64)
    {
        // Normaliza para base64 padrão antes de decodificar
        var normalized = base64.Replace('-', '+').Replace('_', '/');
        // Recoloca padding se necessário
        normalized = normalized.PadRight(normalized.Length + (4 - normalized.Length % 4) % 4, '=');
        var bytes = Convert.FromBase64String(normalized);
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    public async Task<ServiceResult<DepositResponse>> CreateInvoiceAsync(long amountSats, string? memo, CancellationToken ct = default)
    {
        try
        {
            var response = await _httpClient.PostAsJsonAsync("/v1/invoices", new LndInvoiceRequest
            {
                Value = amountSats.ToString(),
                Memo = memo ?? string.Empty,
                Expiry = "3600"
            }, ct);

            if (!response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadAsStringAsync(ct);
                _logger.LogError("LND create invoice failed: {Status} {Body}", response.StatusCode, body);
                return ServiceResult<DepositResponse>.Fail($"LND error: {response.StatusCode}");
            }

            var lndResponse = await response.Content.ReadFromJsonAsync<LndInvoiceResponse>(ct);
            if (lndResponse is null)
                return ServiceResult<DepositResponse>.Fail("Invalid response from LND");

            var expiresAt = DateTimeOffset.UtcNow.AddHours(1).ToUnixTimeSeconds();
            return ServiceResult<DepositResponse>.Ok(new DepositResponse(
                lndResponse.PaymentRequest,
                Base64ToHex(lndResponse.RHash),   // hex, igual ao lncli
                expiresAt
            ));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling LND create invoice");
            return ServiceResult<DepositResponse>.Fail(ex.Message);
        }
    }

    public async Task<ServiceResult<WithdrawResponse>> PayInvoiceAsync(string paymentRequest, long? maxFeeSats, CancellationToken ct = default)
    {
        var request = new LndPayRequest
        {
            PaymentRequest = paymentRequest,
            FeeLimit = new LndFeeLimit { Fixed = (maxFeeSats ?? 10).ToString() }
        };

        try
        {
            var response = await _httpClient.PostAsJsonAsync("/v1/channels/transactions", request, ct);

            if (!response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadAsStringAsync(ct);
                _logger.LogError("LND pay invoice failed: {Status} {Body}", response.StatusCode, body);
                return ServiceResult<WithdrawResponse>.Fail($"LND error: {response.StatusCode}");
            }

            var lndResponse = await response.Content.ReadFromJsonAsync<LndPayResponse>(ct);
            if (lndResponse is null)
                return ServiceResult<WithdrawResponse>.Fail("Invalid response from LND");

            if (!string.IsNullOrEmpty(lndResponse.PaymentError))
            {
                _logger.LogError("LND payment error: {Error}", lndResponse.PaymentError);
                return ServiceResult<WithdrawResponse>.Fail(lndResponse.PaymentError);
            }

            var fees = long.TryParse(lndResponse.PaymentRoute?.TotalFees, out var f) ? f : 0L;
            return ServiceResult<WithdrawResponse>.Ok(new WithdrawResponse(
                Base64ToHex(lndResponse.PaymentHash),
                Base64ToHex(lndResponse.PaymentPreimage),
                fees
            ));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling LND pay invoice");
            return ServiceResult<WithdrawResponse>.Fail(ex.Message);
        }
    }

    public async Task<ServiceResult<InvoiceStatusResponse>> GetInvoiceAsync(string rHash, CancellationToken ct = default)
    {
        try
        {
            // LND REST GET /v1/invoice/{r_hash_str} espera hex — igual ao lncli
            var response = await _httpClient.GetAsync($"/v1/invoice/{rHash}", ct);

            if (response.StatusCode == HttpStatusCode.NotFound)
                return ServiceResult<InvoiceStatusResponse>.Fail("Invoice not found");

            if (!response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadAsStringAsync(ct);
                _logger.LogError("LND get invoice failed: {Status} {Body}", response.StatusCode, body);
                return ServiceResult<InvoiceStatusResponse>.Fail($"LND error: {response.StatusCode}");
            }

            var lndResponse = await response.Content.ReadFromJsonAsync<LndGetInvoiceResponse>(ct);
            if (lndResponse is null)
                return ServiceResult<InvoiceStatusResponse>.Fail("Invalid response from LND");

            var amountSats = long.TryParse(lndResponse.Value,      out var v) ? v : 0L;
            var amountPaid = long.TryParse(lndResponse.AmtPaidSat, out var p) ? p : 0L;

            return ServiceResult<InvoiceStatusResponse>.Ok(new InvoiceStatusResponse(
                Base64ToHex(lndResponse.RHash),   // hex, consistente com o deposit
                lndResponse.State,
                lndResponse.Settled,
                amountSats,
                amountPaid,
                lndResponse.Memo
            ));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling LND get invoice");
            return ServiceResult<InvoiceStatusResponse>.Fail(ex.Message);
        }
    }
}

using System.Net.Http.Json;
using api.Models;

namespace api.Services;

public class LightningGatewayService(HttpClient http) : ILightningGatewayService
{
    public async Task<ServiceResult<GatewayDepositResponse>> CreateInvoiceAsync(long amountSats, string? memo, CancellationToken ct = default)
    {
        try
        {
            var resp = await http.PostAsJsonAsync("/api/wallet/deposit",
                new { amountSats, memo }, ct);

            if (!resp.IsSuccessStatusCode)
            {
                var err = await resp.Content.ReadAsStringAsync(ct);
                return ServiceResult<GatewayDepositResponse>.Fail($"Gateway error: {err}");
            }

            var body = await resp.Content.ReadFromJsonAsync<GatewayDepositBody>(ct);
            if (body is null)
                return ServiceResult<GatewayDepositResponse>.Fail("Empty response from gateway");

            return ServiceResult<GatewayDepositResponse>.Ok(
                new GatewayDepositResponse(body.PaymentRequest, body.RHash, body.ExpiresAt));
        }
        catch (Exception ex)
        {
            return ServiceResult<GatewayDepositResponse>.Fail($"Gateway unreachable: {ex.Message}");
        }
    }

    public async Task<ServiceResult<GatewayInvoiceStatus>> GetInvoiceStatusAsync(string rHash, CancellationToken ct = default)
    {
        try
        {
            var resp = await http.GetAsync($"/api/wallet/invoice/{rHash}", ct);

            if (resp.StatusCode == System.Net.HttpStatusCode.NotFound)
                return ServiceResult<GatewayInvoiceStatus>.Fail("Invoice not found");

            if (!resp.IsSuccessStatusCode)
            {
                var err = await resp.Content.ReadAsStringAsync(ct);
                return ServiceResult<GatewayInvoiceStatus>.Fail($"Gateway error: {err}");
            }

            var body = await resp.Content.ReadFromJsonAsync<GatewayInvoiceStatusBody>(ct);
            if (body is null)
                return ServiceResult<GatewayInvoiceStatus>.Fail("Empty response from gateway");

            return ServiceResult<GatewayInvoiceStatus>.Ok(
                new GatewayInvoiceStatus(body.State, body.Settled, body.AmountSats, body.AmountPaidSats));
        }
        catch (Exception ex)
        {
            return ServiceResult<GatewayInvoiceStatus>.Fail($"Gateway unreachable: {ex.Message}");
        }
    }

    public async Task<ServiceResult<GatewayWithdrawResponse>> PayInvoiceAsync(string invoice, long maxFeeSats, CancellationToken ct = default)
    {
        try
        {
            var resp = await http.PostAsJsonAsync("/api/wallet/withdraw",
                new { paymentRequest = invoice, maxFeeSats }, ct);

            if (!resp.IsSuccessStatusCode)
            {
                var err = await resp.Content.ReadAsStringAsync(ct);
                return ServiceResult<GatewayWithdrawResponse>.Fail($"Gateway error: {err}");
            }

            var body = await resp.Content.ReadFromJsonAsync<GatewayWithdrawBody>(ct);
            if (body is null)
                return ServiceResult<GatewayWithdrawResponse>.Fail("Empty response from gateway");

            return ServiceResult<GatewayWithdrawResponse>.Ok(
                new GatewayWithdrawResponse(body.PaymentHash, body.FeePaidSats));
        }
        catch (Exception ex)
        {
            return ServiceResult<GatewayWithdrawResponse>.Fail($"Gateway unreachable: {ex.Message}");
        }
    }

    // Internal response shapes matching lnd-gateway JSON
    private record GatewayDepositBody(string PaymentRequest, string RHash, long ExpiresAt);
    private record GatewayInvoiceStatusBody(string RHash, string State, bool Settled, long AmountSats, long AmountPaidSats, string Memo);
    private record GatewayWithdrawBody(string PaymentHash, string PaymentPreimage, long FeePaidSats);
}

using api.DTOs.Wallet;
using api.Models;

namespace api.Services;

public interface ILightningService
{
    Task<ServiceResult<DepositInitiatedResponse>> InitiateDepositAsync(Guid playerId, long amountSats, string? memo, CancellationToken ct = default);
    Task<ServiceResult<DepositStatusResponse>> CheckDepositAsync(Guid playerId, string rHash, CancellationToken ct = default);
    Task<ServiceResult<WithdrawResponse>> WithdrawAsync(Guid playerId, string invoice, long amountSats, long maxFeeSats, CancellationToken ct = default);
    Task<ServiceResult<WithdrawResponse>> WithdrawToAddressAsync(Guid playerId, long amountSats, long maxFeeSats, CancellationToken ct = default);
}

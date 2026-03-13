using api.DTOs.Wallet;
using api.Models;
using api.Models.Enums;

namespace api.Services;

public interface IWalletService
{
    Task<WalletResponse> GetOrCreateAsync(Guid playerId, CancellationToken ct = default);

    /// <summary>Credit available balance (e.g. after deposit).</summary>
    Task<ServiceResult<bool>> CreditAsync(Guid playerId, long amountSats, LedgerEntryType type,
        Guid? gameId = null, Guid? paymentId = null, CancellationToken ct = default);

    /// <summary>Debit available balance (e.g. withdrawal). Fails if insufficient funds.</summary>
    Task<ServiceResult<bool>> DebitAsync(Guid playerId, long amountSats, LedgerEntryType type,
        Guid? gameId = null, Guid? paymentId = null, CancellationToken ct = default);

    /// <summary>Move funds from available to locked (bet placement). Fails if insufficient funds.</summary>
    Task<ServiceResult<bool>> LockAsync(Guid playerId, long amountSats, Guid gameId, CancellationToken ct = default);

    /// <summary>Release locked funds back to available (cancelled game).</summary>
    Task<ServiceResult<bool>> UnlockAsync(Guid playerId, long amountSats, Guid gameId, CancellationToken ct = default);

    Task<IEnumerable<LedgerEntryResponse>> GetTransactionsAsync(Guid playerId, CancellationToken ct = default);
}

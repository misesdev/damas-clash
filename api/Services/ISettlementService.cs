using api.Models;

namespace api.Services;

public interface ISettlementService
{
    /// <summary>
    /// Lock bets from both players when a game starts (player joins).
    /// </summary>
    Task<ServiceResult<bool>> LockBetsAsync(Guid gameId, Guid playerBlackId, Guid playerWhiteId, long betAmountSats, CancellationToken ct = default);

    /// <summary>
    /// Unlock PlayerBlack's bet when the creator cancels a waiting game.
    /// </summary>
    Task<ServiceResult<bool>> UnlockCreatorBetAsync(Guid gameId, Guid playerBlackId, long betAmountSats, CancellationToken ct = default);

    /// <summary>
    /// Settle completed game: distribute pot to winner minus platform fee.
    /// Platform fee = 5% of pot. Winner receives 95% of pot.
    /// </summary>
    Task<ServiceResult<bool>> SettleAsync(Guid gameId, Guid winnerId, Guid loserId, long betAmountSats, CancellationToken ct = default);
}

using System.Data;
using api.Data;
using api.Models;
using api.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace api.Services;

public class SettlementService(DamasDbContext db, IWalletService walletService) : ISettlementService
{
    private const decimal PlatformFeePercent = 0.05m;

    public async Task<ServiceResult<bool>> LockBetsAsync(
        Guid gameId, Guid playerBlackId, Guid playerWhiteId, long betAmountSats, CancellationToken ct = default)
    {
        if (betAmountSats <= 0)
            return ServiceResult<bool>.Ok(true);

        var lockBlack = await walletService.LockAsync(playerBlackId, betAmountSats, gameId, ct);
        if (!lockBlack.IsSuccess)
            return ServiceResult<bool>.Fail($"Player (black) has insufficient balance: {lockBlack.Error}");

        var lockWhite = await walletService.LockAsync(playerWhiteId, betAmountSats, gameId, ct);
        if (!lockWhite.IsSuccess)
        {
            // Rollback black's lock
            await walletService.UnlockAsync(playerBlackId, betAmountSats, gameId, ct);
            return ServiceResult<bool>.Fail($"Player (white) has insufficient balance: {lockWhite.Error}");
        }

        return ServiceResult<bool>.Ok(true);
    }

    public async Task<ServiceResult<bool>> UnlockCreatorBetAsync(
        Guid gameId, Guid playerBlackId, long betAmountSats, CancellationToken ct = default)
    {
        if (betAmountSats <= 0)
            return ServiceResult<bool>.Ok(true);

        return await walletService.UnlockAsync(playerBlackId, betAmountSats, gameId, ct);
    }

    public async Task<ServiceResult<bool>> SettleAsync(
        Guid gameId, Guid winnerId, Guid loserId, long betAmountSats, CancellationToken ct = default)
    {
        if (betAmountSats <= 0)
            return ServiceResult<bool>.Ok(true);

        await using var tx = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, ct);
        try
        {
            long pot = betAmountSats * 2;
            long fee = (long)Math.Floor(pot * PlatformFeePercent);
            long prize = pot - fee;

            // Winner: release their locked bet + credit net profit (opponent's bet minus fee)
            // BalanceSats already includes their own locked bet, so only add the net gain.
            var winnerWallet = await db.Wallets.FirstOrDefaultAsync(w => w.PlayerId == winnerId, ct);
            if (winnerWallet is null)
                return ServiceResult<bool>.Fail("Winner wallet not found");

            winnerWallet.LockedBalanceSats -= betAmountSats;
            winnerWallet.BalanceSats += (prize - betAmountSats); // net gain = opponent's bet - fee
            winnerWallet.UpdatedAt = DateTimeOffset.UtcNow;

            // Loser: forfeit their locked bet (remove from total balance too)
            var loserWallet = await db.Wallets.FirstOrDefaultAsync(w => w.PlayerId == loserId, ct);
            if (loserWallet is null)
                return ServiceResult<bool>.Fail("Loser wallet not found");

            loserWallet.LockedBalanceSats -= betAmountSats;
            loserWallet.BalanceSats -= betAmountSats; // their bet is permanently lost
            loserWallet.UpdatedAt = DateTimeOffset.UtcNow;

            // Ledger entries
            db.LedgerEntries.AddRange(
                new LedgerEntry
                {
                    Id = Guid.NewGuid(), PlayerId = winnerId,
                    Type = LedgerEntryType.GameWin, AmountSats = prize,
                    GameId = gameId, CreatedAt = DateTimeOffset.UtcNow
                },
                new LedgerEntry
                {
                    Id = Guid.NewGuid(), PlayerId = winnerId,
                    Type = LedgerEntryType.GameFee, AmountSats = fee,
                    GameId = gameId, CreatedAt = DateTimeOffset.UtcNow
                },
                new LedgerEntry
                {
                    Id = Guid.NewGuid(), PlayerId = loserId,
                    Type = LedgerEntryType.GameBetUnlock, AmountSats = betAmountSats,
                    GameId = gameId, CreatedAt = DateTimeOffset.UtcNow
                }
            );

            await db.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);
            return ServiceResult<bool>.Ok(true);
        }
        catch
        {
            await tx.RollbackAsync(ct);
            throw;
        }
    }
}

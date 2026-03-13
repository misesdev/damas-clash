using System.Data;
using api.Data;
using api.DTOs.Wallet;
using api.Models;
using api.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace api.Services;

public class WalletService(DamasDbContext db) : IWalletService
{
    public async Task<WalletResponse> GetOrCreateAsync(Guid playerId, CancellationToken ct = default)
    {
        var wallet = await db.Wallets.FirstOrDefaultAsync(w => w.PlayerId == playerId, ct);
        if (wallet is null)
        {
            wallet = new Wallet
            {
                Id = Guid.NewGuid(),
                PlayerId = playerId,
                BalanceSats = 0,
                LockedBalanceSats = 0,
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            };
            db.Wallets.Add(wallet);
            await db.SaveChangesAsync(ct);
        }
        return ToResponse(wallet);
    }

    public async Task<ServiceResult<bool>> CreditAsync(Guid playerId, long amountSats, LedgerEntryType type,
        Guid? gameId = null, Guid? paymentId = null, CancellationToken ct = default)
    {
        await using var tx = await BeginTransactionAsync(ct);
        try
        {
            var wallet = await GetOrCreateWalletForUpdateAsync(playerId, ct);
            wallet.BalanceSats += amountSats;
            wallet.UpdatedAt = DateTimeOffset.UtcNow;

            db.LedgerEntries.Add(new LedgerEntry
            {
                Id = Guid.NewGuid(),
                PlayerId = playerId,
                Type = type,
                AmountSats = amountSats,
                GameId = gameId,
                PaymentId = paymentId,
                CreatedAt = DateTimeOffset.UtcNow
            });

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

    public async Task<ServiceResult<bool>> DebitAsync(Guid playerId, long amountSats, LedgerEntryType type,
        Guid? gameId = null, Guid? paymentId = null, CancellationToken ct = default)
    {
        await using var tx = await BeginTransactionAsync(ct);
        try
        {
            var wallet = await GetOrCreateWalletForUpdateAsync(playerId, ct);

            if (wallet.AvailableBalanceSats < amountSats)
            {
                await tx.RollbackAsync(ct);
                return ServiceResult<bool>.Fail("Insufficient balance");
            }

            wallet.BalanceSats -= amountSats;
            wallet.UpdatedAt = DateTimeOffset.UtcNow;

            db.LedgerEntries.Add(new LedgerEntry
            {
                Id = Guid.NewGuid(),
                PlayerId = playerId,
                Type = type,
                AmountSats = amountSats,
                GameId = gameId,
                PaymentId = paymentId,
                CreatedAt = DateTimeOffset.UtcNow
            });

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

    public async Task<ServiceResult<bool>> LockAsync(Guid playerId, long amountSats, Guid gameId, CancellationToken ct = default)
    {
        await using var tx = await BeginTransactionAsync(ct);
        try
        {
            var wallet = await GetOrCreateWalletForUpdateAsync(playerId, ct);

            if (wallet.AvailableBalanceSats < amountSats)
            {
                await tx.RollbackAsync(ct);
                return ServiceResult<bool>.Fail("Insufficient balance to place bet");
            }

            wallet.LockedBalanceSats += amountSats;
            wallet.UpdatedAt = DateTimeOffset.UtcNow;

            db.LedgerEntries.Add(new LedgerEntry
            {
                Id = Guid.NewGuid(),
                PlayerId = playerId,
                Type = LedgerEntryType.GameBetLock,
                AmountSats = amountSats,
                GameId = gameId,
                CreatedAt = DateTimeOffset.UtcNow
            });

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

    public async Task<ServiceResult<bool>> UnlockAsync(Guid playerId, long amountSats, Guid gameId, CancellationToken ct = default)
    {
        await using var tx = await BeginTransactionAsync(ct);
        try
        {
            var wallet = await GetOrCreateWalletForUpdateAsync(playerId, ct);

            if (wallet.LockedBalanceSats < amountSats)
            {
                await tx.RollbackAsync(ct);
                return ServiceResult<bool>.Fail("Insufficient locked balance");
            }

            wallet.LockedBalanceSats -= amountSats;
            wallet.UpdatedAt = DateTimeOffset.UtcNow;

            db.LedgerEntries.Add(new LedgerEntry
            {
                Id = Guid.NewGuid(),
                PlayerId = playerId,
                Type = LedgerEntryType.GameBetUnlock,
                AmountSats = amountSats,
                GameId = gameId,
                CreatedAt = DateTimeOffset.UtcNow
            });

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

    public async Task<IEnumerable<LedgerEntryResponse>> GetTransactionsAsync(Guid playerId, CancellationToken ct = default)
    {
        return await db.LedgerEntries
            .Where(l => l.PlayerId == playerId)
            .OrderByDescending(l => l.CreatedAt)
            .Select(l => new LedgerEntryResponse(
                l.Id, l.Type.ToString(), l.AmountSats, l.GameId, l.PaymentId, l.CreatedAt))
            .ToListAsync(ct);
    }

    private async Task<Wallet> GetOrCreateWalletForUpdateAsync(Guid playerId, CancellationToken ct)
    {
        var wallet = await db.Wallets.FirstOrDefaultAsync(w => w.PlayerId == playerId, ct);
        if (wallet is null)
        {
            wallet = new Wallet
            {
                Id = Guid.NewGuid(),
                PlayerId = playerId,
                BalanceSats = 0,
                LockedBalanceSats = 0,
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            };
            db.Wallets.Add(wallet);
        }
        return wallet;
    }

    private async Task<Microsoft.EntityFrameworkCore.Storage.IDbContextTransaction> BeginTransactionAsync(CancellationToken ct)
    {
        // InMemory provider supports transactions as no-ops; PostgreSQL uses real transactions
        return await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, ct);
    }

    private static WalletResponse ToResponse(Wallet w) =>
        new(w.BalanceSats, w.LockedBalanceSats, w.AvailableBalanceSats);
}

using api.Data;
using api.DTOs.Admin;
using api.Models;
using api.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace api.Services;

public class DashboardService(
    DamasDbContext db,
    IOnlinePlayerTracker tracker) : IDashboardService
{
    public async Task<DashboardResponse> GetAsync(CancellationToken ct = default)
    {
        var now = DateTimeOffset.UtcNow;
        var day1 = now.AddDays(-1);
        var day7 = now.AddDays(-7);
        var day30 = now.AddDays(-30);

        // ── Summary stats ────────────────────────────────────────────────────────

        var totalBalance = await db.Wallets.SumAsync(w => w.BalanceSats, ct);

        var regDay = await db.Players.CountAsync(p => p.CreatedAt >= day1, ct);
        var regWeek = await db.Players.CountAsync(p => p.CreatedAt >= day7, ct);
        var regMonth = await db.Players.CountAsync(p => p.CreatedAt >= day30, ct);

        var delDay = await db.AccountDeletionLogs.CountAsync(a => a.OccurredAt >= day1, ct);
        var delWeek = await db.AccountDeletionLogs.CountAsync(a => a.OccurredAt >= day7, ct);
        var delMonth = await db.AccountDeletionLogs.CountAsync(a => a.OccurredAt >= day30, ct);

        var gamesBase = db.Games.Where(g => g.Status == GameStatus.Completed);

        var gameDay = await gamesBase.CountAsync(g => g.UpdatedAt >= day1, ct);
        var gameWeek = await gamesBase.CountAsync(g => g.UpdatedAt >= day7, ct);
        var gameMonth = await gamesBase.CountAsync(g => g.UpdatedAt >= day30, ct);

        var friendlyBase = gamesBase.Where(g => g.BetAmountSats == 0);
        var fDay = await friendlyBase.CountAsync(g => g.UpdatedAt >= day1, ct);
        var fWeek = await friendlyBase.CountAsync(g => g.UpdatedAt >= day7, ct);
        var fMonth = await friendlyBase.CountAsync(g => g.UpdatedAt >= day30, ct);

        var betBase = gamesBase.Where(g => g.BetAmountSats > 0);
        var bDay = await betBase.CountAsync(g => g.UpdatedAt >= day1, ct);
        var bWeek = await betBase.CountAsync(g => g.UpdatedAt >= day7, ct);
        var bMonth = await betBase.CountAsync(g => g.UpdatedAt >= day30, ct);

        // ── Chart data (last 30 days, grouped by date) ───────────────────────────

        var depositChart = await BuildLedgerChartAsync(LedgerEntryType.Deposit, day30, ct);
        var withdrawChart = await BuildLedgerChartAsync(LedgerEntryType.Withdrawal, day30, ct);
        var betGamesChart = await BuildBetGamesChartAsync(day30, ct);
        var userGrowthChart = await BuildUserGrowthChartAsync(day30, ct);

        return new DashboardResponse(
            TotalBalanceSats: totalBalance,
            ActiveUsersNow: tracker.Count,
            Registrations: new PeriodStats(regDay, regWeek, regMonth),
            Deletions: new PeriodStats(delDay, delWeek, delMonth),
            Games: new GamesPeriodStats(
                new PeriodStats(gameDay, gameWeek, gameMonth),
                new PeriodStats(fDay, fWeek, fMonth),
                new PeriodStats(bDay, bWeek, bMonth)),
            DepositChart: depositChart,
            WithdrawChart: withdrawChart,
            BetGamesChart: betGamesChart,
            UserGrowthChart: userGrowthChart);
    }

    private async Task<IReadOnlyList<TimeSeriesPoint>> BuildLedgerChartAsync(
        LedgerEntryType type, DateTimeOffset from, CancellationToken ct)
    {
        var raw = await db.LedgerEntries
            .Where(l => l.Type == type && l.CreatedAt >= from)
            .GroupBy(l => l.CreatedAt.Date)
            .Select(g => new { Date = g.Key, Count = g.Count(), Amount = g.Sum(l => l.AmountSats) })
            .ToListAsync(ct);

        return FillDays(from, raw.ToDictionary(
            r => r.Date,
            r => new TimeSeriesPoint(r.Date.ToString("yyyy-MM-dd"), r.Count, r.Amount)));
    }

    private async Task<IReadOnlyList<TimeSeriesPoint>> BuildBetGamesChartAsync(
        DateTimeOffset from, CancellationToken ct)
    {
        var raw = await db.Games
            .Where(g => g.BetAmountSats > 0 && g.Status == GameStatus.Completed && g.UpdatedAt >= from)
            .GroupBy(g => g.UpdatedAt.Date)
            .Select(g => new { Date = g.Key, Count = g.Count(), Amount = g.Sum(x => x.BetAmountSats * 2) })
            .ToListAsync(ct);

        return FillDays(from, raw.ToDictionary(
            r => r.Date,
            r => new TimeSeriesPoint(r.Date.ToString("yyyy-MM-dd"), r.Count, r.Amount)));
    }

    private async Task<IReadOnlyList<UserGrowthPoint>> BuildUserGrowthChartAsync(
        DateTimeOffset from, CancellationToken ct)
    {
        var registrations = await db.Players
            .Where(p => p.CreatedAt >= from)
            .GroupBy(p => p.CreatedAt.Date)
            .Select(g => new { Date = g.Key, Count = g.Count() })
            .ToListAsync(ct);

        var deletions = await db.AccountDeletionLogs
            .Where(d => d.OccurredAt >= from)
            .GroupBy(d => d.OccurredAt.Date)
            .Select(g => new { Date = g.Key, Count = g.Count() })
            .ToListAsync(ct);

        var regMap = registrations.ToDictionary(r => r.Date, r => r.Count);
        var delMap = deletions.ToDictionary(d => d.Date, d => d.Count);

        return Enumerable.Range(0, 30)
            .Select(i => from.AddDays(i).Date)
            .Select(d => new UserGrowthPoint(
                d.ToString("yyyy-MM-dd"),
                regMap.GetValueOrDefault(d, 0),
                delMap.GetValueOrDefault(d, 0)))
            .ToList();
    }

    private static IReadOnlyList<TimeSeriesPoint> FillDays(
        DateTimeOffset from,
        Dictionary<DateTime, TimeSeriesPoint> map)
    {
        return Enumerable.Range(0, 30)
            .Select(i => from.AddDays(i).Date)
            .Select(d => map.TryGetValue(d, out var p)
                ? p
                : new TimeSeriesPoint(d.ToString("yyyy-MM-dd"), 0, 0))
            .ToList();
    }
}

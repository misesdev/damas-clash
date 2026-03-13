namespace api.DTOs.Admin;

public record PeriodStats(int Day, int Week, int Month);

public record GamesPeriodStats(
    PeriodStats Total,
    PeriodStats Friendly,
    PeriodStats Bet);

public record TimeSeriesPoint(string Date, int Count, long AmountSats);

public record UserGrowthPoint(string Date, int Registered, int Deleted);

public record DashboardResponse(
    long TotalBalanceSats,
    int ActiveUsersNow,
    PeriodStats Registrations,
    PeriodStats Deletions,
    GamesPeriodStats Games,
    IReadOnlyList<TimeSeriesPoint> DepositChart,
    IReadOnlyList<TimeSeriesPoint> WithdrawChart,
    IReadOnlyList<TimeSeriesPoint> BetGamesChart,
    IReadOnlyList<UserGrowthPoint> UserGrowthChart);

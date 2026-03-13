import { request } from './client';

export interface PeriodStats {
  day: number;
  week: number;
  month: number;
}

export interface GamesPeriodStats {
  total: PeriodStats;
  friendly: PeriodStats;
  bet: PeriodStats;
}

export interface TimeSeriesPoint {
  date: string;
  count: number;
  amountSats: number;
}

export interface UserGrowthPoint {
  date: string;
  registered: number;
  deleted: number;
}

export interface DashboardData {
  totalBalanceSats: number;
  activeUsersNow: number;
  registrations: PeriodStats;
  deletions: PeriodStats;
  games: GamesPeriodStats;
  depositChart: TimeSeriesPoint[];
  withdrawChart: TimeSeriesPoint[];
  betGamesChart: TimeSeriesPoint[];
  userGrowthChart: UserGrowthPoint[];
}

export const getDashboard = (token: string) =>
  request<DashboardData>('/api/admin/dashboard', {
    headers: { Authorization: `Bearer ${token}` },
  });

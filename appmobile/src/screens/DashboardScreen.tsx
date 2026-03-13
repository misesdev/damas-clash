import React, { useEffect, useState, useTransition } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getDashboard, type DashboardData, type TimeSeriesPoint, type UserGrowthPoint } from '../api/admin';
import { colors } from '../theme/colors';
import type { LoginResponse } from '../types/auth';
import { ScreenHeader } from '../components/ScreenHeader';

interface Props {
  session: LoginResponse;
  onBack: () => void;
}

function KpiCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <View style={styles.kpiCard}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={[styles.kpiValue, accent ? { color: accent } : {}]}>{value}</Text>
      {sub ? <Text style={styles.kpiSub}>{sub}</Text> : null}
    </View>
  );
}

function PeriodCard({ label, day, week, month, accent }: { label: string; day: number; week: number; month: number; accent?: string }) {
  const col = accent ?? colors.text;
  return (
    <View style={styles.periodCard}>
      <Text style={[styles.periodTitle, { color: accent ?? colors.textMuted }]}>{label}</Text>
      <View style={styles.periodRow}>
        {[['24h', day], ['7d', week], ['30d', month]].map(([l, v]) => (
          <View key={String(l)} style={styles.periodCell}>
            <Text style={[styles.periodValue, { color: col }]}>{v}</Text>
            <Text style={styles.periodLabel}>{l}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function BarChart({ data, color, valueKey }: { data: TimeSeriesPoint[]; color: string; valueKey: 'count' | 'amountSats' }) {
  const values = data.map(d => d[valueKey]);
  const max = Math.max(...values, 1);
  const last14 = data.slice(-14);
  return (
    <View style={styles.barChart}>
      {last14.map((d, i) => {
        const val = d[valueKey];
        const h = Math.max(2, (val / max) * 80);
        return (
          <View key={i} style={styles.barCol}>
            <View style={[styles.bar, { height: h, backgroundColor: color }]} />
          </View>
        );
      })}
    </View>
  );
}

function GrowthChart({ data }: { data: UserGrowthPoint[] }) {
  const maxR = Math.max(...data.map(d => d.registered), 1);
  const maxD = Math.max(...data.map(d => d.deleted), 1);
  const maxVal = Math.max(maxR, maxD, 1);
  const last14 = data.slice(-14);
  return (
    <View style={styles.barChart}>
      {last14.map((d, i) => (
        <View key={i} style={[styles.barCol, { gap: 2 }]}>
          <View style={[styles.bar, { height: Math.max(2, (d.registered / maxVal) * 80), backgroundColor: '#3b82f6' }]} />
          <View style={[styles.bar, { height: Math.max(2, (d.deleted / maxVal) * 80), backgroundColor: '#ff453a' }]} />
        </View>
      ))}
    </View>
  );
}

function SectionTitle({ children }: { children: string }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.chartCard}>
      <Text style={styles.chartTitle}>{title}</Text>
      {children}
      <View style={styles.chartLegendRow}>
        <Text style={styles.chartLegendText}>← últimos 14 dias →</Text>
      </View>
    </View>
  );
}

export function DashboardScreen({ session, onBack }: Props) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getDashboard(session.token)
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [session.token]);

  const formatSats = (n: number) =>
    n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(1)}k` : String(n);

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="DashBoard" onBack={onBack}/>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Heading */}
        <Text style={styles.subheading}>Visão geral da plataforma</Text>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={colors.text} size="large" />
          </View>
        )}

        {error && (
          <Text style={styles.errorText}>Erro ao carregar dados.</Text>
        )}

        {data && (
          <>
            {/* KPIs */}
            <View style={styles.kpiRow}>
              <KpiCard label="Saldo Total" value={`${formatSats(data.totalBalanceSats)} sats`} sub="em todas as carteiras" accent="#f7931a" />
              <KpiCard label="Online Agora" value={data.activeUsersNow} sub="usuários conectados" />
            </View>

            <SectionTitle>Cadastros</SectionTitle>
            <PeriodCard label="Novos usuários" day={data.registrations.day} week={data.registrations.week} month={data.registrations.month} accent="#3b82f6" />

            <SectionTitle>Exclusões de Conta</SectionTitle>
            <PeriodCard label="Contas excluídas" day={data.deletions.day} week={data.deletions.week} month={data.deletions.month} accent="#ff453a" />

            <SectionTitle>Partidas</SectionTitle>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <PeriodCard label="Total" day={data.games.total.day} week={data.games.total.week} month={data.games.total.month} />
            </View>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
              <View style={{ flex: 1 }}>
                <PeriodCard label="Amigáveis" day={data.games.friendly.day} week={data.games.friendly.week} month={data.games.friendly.month} />
              </View>
              <View style={{ flex: 1 }}>
                <PeriodCard label="⚡ Apostas" day={data.games.bet.day} week={data.games.bet.week} month={data.games.bet.month} accent="#f7931a" />
              </View>
            </View>

            <SectionTitle>Gráficos (últimos 14 dias)</SectionTitle>

            <ChartCard title="Depósitos (qtd.)">
              <BarChart data={data.depositChart} color="#2ecc71" valueKey="count" />
            </ChartCard>

            <ChartCard title="Saques (qtd.)">
              <BarChart data={data.withdrawChart} color="#f7931a" valueKey="count" />
            </ChartCard>

            <ChartCard title="Partidas com Apostas">
              <BarChart data={data.betGamesChart} color="#f7931a" valueKey="count" />
            </ChartCard>

            <ChartCard title="Crescimento vs. Churn">
              <View style={styles.legendRow}>
                <View style={[styles.legendDot, { backgroundColor: '#3b82f6' }]} /><Text style={styles.legendText}>Cadastros</Text>
                <View style={[styles.legendDot, { backgroundColor: '#ff453a', marginLeft: 12 }]} /><Text style={styles.legendText}>Exclusões</Text>
              </View>
              <GrowthChart data={data.userGrowthChart} />
            </ChartCard>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 20, paddingBottom: 60 },
  backBtn: { marginBottom: 24 },
  backText: { color: colors.textMuted, fontSize: 14, fontWeight: '600' },
  heading: { color: colors.text, fontSize: 24, fontWeight: '800', marginBottom: 4 },
  subheading: { color: colors.textMuted, fontSize: 14, marginBottom: 28 },
  loadingContainer: { paddingVertical: 60, alignItems: 'center' },
  errorText: { color: colors.error, fontSize: 14 },
  kpiRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  kpiCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 4,
  },
  kpiLabel: { fontSize: 10, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6 },
  kpiValue: { fontSize: 22, fontWeight: '800', color: colors.text, lineHeight: 26 },
  kpiSub: { fontSize: 11, color: colors.textMuted },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 24,
    marginBottom: 10,
  },
  periodCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 0,
  },
  periodTitle: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 },
  periodRow: { flexDirection: 'row', justifyContent: 'space-between' },
  periodCell: { alignItems: 'center' },
  periodValue: { fontSize: 20, fontWeight: '800', color: colors.text },
  periodLabel: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
  chartCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 12,
  },
  chartTitle: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 14 },
  barChart: { flexDirection: 'row', alignItems: 'flex-end', height: 88, gap: 3 },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 3, minHeight: 2 },
  chartLegendRow: { marginTop: 6, alignItems: 'center' },
  chartLegendText: { fontSize: 10, color: colors.textMuted },
  legendRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: colors.textMuted, marginLeft: 4 },
});

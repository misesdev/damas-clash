'use client';

import { useEffect, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import { getDashboard, type DashboardData, type PeriodStats } from '../api/admin';
import type { LoginResponse } from '../types/auth';
import '../i18n';

interface Props {
  session: LoginResponse;
  onBack: () => void;
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 16,
      padding: '18px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
    }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</span>
      <span style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', lineHeight: 1.1 }}>{value}</span>
      {sub && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{sub}</span>}
    </div>
  );
}

function PeriodRow({ label, stats }: { label: string; stats: PeriodStats }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
      <StatCard label={`${label} · 24h`} value={stats.day} />
      <StatCard label={`${label} · 7d`} value={stats.week} />
      <StatCard label={`${label} · 30d`} value={stats.month} />
    </div>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <p style={{
      fontSize: 11,
      fontWeight: 700,
      color: 'var(--text-muted)',
      textTransform: 'uppercase',
      letterSpacing: 1,
      margin: '28px 0 12px',
    }}>
      {children}
    </p>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 16,
      padding: '20px 16px 12px',
      marginBottom: 16,
    }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>{title}</p>
      {children}
    </div>
  );
}

const TOOLTIP_STYLE = {
  background: '#111',
  border: '1px solid #333',
  borderRadius: 8,
  fontSize: 12,
  color: '#fff',
};

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

  const shortDate = (d: string) => d.slice(5); // "MM-DD"

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)', overflowY: 'auto' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', width: '100%', padding: '32px 24px 64px' }}>

        {/* Back */}
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text-muted)', padding: 0, marginBottom: 28, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <span style={{ fontSize: 16 }}>←</span> Voltar
        </button>

        {/* Heading */}
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>Dashboard</h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 32 }}>Visão geral da plataforma</p>

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.12)', borderTopColor: 'white', animation: 'spin 0.7s linear infinite' }} />
          </div>
        )}

        {error && (
          <p style={{ color: 'var(--danger)', fontSize: 14 }}>Erro ao carregar dados do dashboard.</p>
        )}

        {data && (
          <>
            {/* ── Top KPIs ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 8 }}>
              <StatCard label="Saldo Total" value={`${formatSats(data.totalBalanceSats)} sats`} sub="soma de todas as carteiras" />
              <StatCard label="Usuários Online" value={data.activeUsersNow} sub="conectados agora" />
            </div>

            {/* ── Registrations ── */}
            <SectionTitle>Cadastros</SectionTitle>
            <PeriodRow label="Novos usuários" stats={data.registrations} />

            {/* ── Deletions ── */}
            <SectionTitle>Exclusões de Conta</SectionTitle>
            <PeriodRow label="Contas excluídas" stats={data.deletions} />

            {/* ── Games ── */}
            <SectionTitle>Partidas</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '16px 20px' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>Total</p>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  {[['24h', data.games.total.day], ['7d', data.games.total.week], ['30d', data.games.total.month]].map(([l, v]) => (
                    <div key={String(l)} style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>{v}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-faint)' }}>{l}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '16px 20px' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>Amigáveis</p>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  {[['24h', data.games.friendly.day], ['7d', data.games.friendly.week], ['30d', data.games.friendly.month]].map(([l, v]) => (
                    <div key={String(l)} style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>{v}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-faint)' }}>{l}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '16px 20px' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#f7931a', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>⚡ Valendo Sats</p>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  {[['24h', data.games.bet.day], ['7d', data.games.bet.week], ['30d', data.games.bet.month]].map(([l, v]) => (
                    <div key={String(l)} style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: 22, fontWeight: 800, color: '#f7931a' }}>{v}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-faint)' }}>{l}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Charts ── */}
            <SectionTitle>Gráficos (últimos 30 dias)</SectionTitle>

            {/* Deposits & Withdrawals */}
            <ChartCard title="Depósitos e Saques">
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={data.depositChart.map((d, i) => ({
                  date: shortDate(d.date),
                  depósitos: d.count,
                  saques: data.withdrawChart[i]?.count ?? 0,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#666' }} interval={4} />
                  <YAxis tick={{ fontSize: 10, fill: '#666' }} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="depósitos" stroke="#2ecc71" fill="rgba(46,204,113,0.15)" strokeWidth={2} />
                  <Area type="monotone" dataKey="saques" stroke="#f7931a" fill="rgba(247,147,26,0.15)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Bet Games */}
            <ChartCard title="Partidas com Apostas (quantidade/dia)">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.betGamesChart.map(d => ({ date: shortDate(d.date), partidas: d.count }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#666' }} interval={4} />
                  <YAxis tick={{ fontSize: 10, fill: '#666' }} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Bar dataKey="partidas" fill="#f7931a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* User Growth / Churn */}
            <ChartCard title="Crescimento de Usuários e Churn">
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={data.userGrowthChart.map(d => ({ date: shortDate(d.date), cadastros: d.registered, exclusões: d.deleted }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#666' }} interval={4} />
                  <YAxis tick={{ fontSize: 10, fill: '#666' }} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="cadastros" stroke="#3b82f6" fill="rgba(59,130,246,0.15)" strokeWidth={2} />
                  <Area type="monotone" dataKey="exclusões" stroke="#ff453a" fill="rgba(255,69,58,0.12)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Volume chart */}
            <ChartCard title="Volume de Sats Depositados/Sacados">
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={data.depositChart.map((d, i) => ({
                  date: shortDate(d.date),
                  depositado: Math.round(d.amountSats / 1000),
                  sacado: Math.round((data.withdrawChart[i]?.amountSats ?? 0) / 1000),
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#666' }} interval={4} />
                  <YAxis tick={{ fontSize: 10, fill: '#666' }} unit="k" />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [`${v}k sats`]} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="depositado" stroke="#2ecc71" fill="rgba(46,204,113,0.15)" strokeWidth={2} />
                  <Area type="monotone" dataKey="sacado" stroke="#f7931a" fill="rgba(247,147,26,0.15)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </>
        )}
      </div>
    </div>
  );
}

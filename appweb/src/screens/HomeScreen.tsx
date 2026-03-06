'use client';

import { GameCard } from '../components/GameCard';
import { useHomeScreen } from '../hooks/useHomeScreen';
import type { LoginResponse } from '../types/auth';
import type { GameResponse, GameStatus } from '../types/game';

interface Props {
  user: LoginResponse;
  pendingGame?: GameResponse | null;
  liveGames?: GameResponse[] | null;
  onGameSelect: (game: GameResponse) => void;
  onGameCancelled?: (gameId: string) => void;
}

type FilterTab = Exclude<GameStatus, 'Completed'>;

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'WaitingForPlayers', label: 'Aguardando' },
  { key: 'InProgress', label: 'Em andamento' },
];

const EMPTY_MESSAGES: Record<FilterTab, string> = {
  WaitingForPlayers: 'Nenhuma partida aguardando jogadores.',
  InProgress: 'Nenhuma partida em andamento.',
};

export function HomeScreen({
  user,
  pendingGame,
  liveGames,
  onGameSelect,
  onGameCancelled,
}: Props) {
  const {
    loading,
    refreshing,
    joiningId,
    cancellingId,
    error,
    activeTab,
    setActiveTab,
    filtered,
    handleRefresh,
    handleGamePress,
    handleCancelGame,
  } = useHomeScreen(user, pendingGame, liveGames, onGameSelect, onGameCancelled);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ── Header ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 24px 0',
          flexShrink: 0,
        }}
      >
        <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', letterSpacing: -0.3 }}>
          Partidas
        </h2>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          title="Atualizar"
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            color: 'var(--text-muted)',
            fontSize: 16,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: refreshing ? 0.4 : 1,
            flexShrink: 0,
          }}
        >
          {refreshing ? (
            <span
              style={{
                display: 'inline-block',
                width: 14,
                height: 14,
                borderRadius: '50%',
                border: '2px solid var(--text-muted)',
                borderTopColor: 'transparent',
                animation: 'spin 0.7s linear infinite',
              }}
            />
          ) : '↻'}
        </button>
      </div>

      {/* ── Filter tabs ── */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          padding: '14px 24px 0',
          flexShrink: 0,
        }}
      >
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '6px 14px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: activeTab === tab.key ? 'var(--text)' : 'var(--surface2)',
              color: activeTab === tab.key ? 'var(--bg)' : 'var(--text-muted)',
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div
          style={{
            margin: '12px 24px 0',
            padding: '10px 14px',
            borderRadius: 12,
            background: 'var(--danger-bg)',
            border: '1px solid rgba(255,69,58,0.3)',
            color: 'var(--danger)',
            fontSize: 13,
            flexShrink: 0,
          }}
        >
          {error}
        </div>
      )}

      {/* ── Content ── */}
      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: '2px solid rgba(255,255,255,0.12)',
              borderTopColor: 'white',
              animation: 'spin 0.7s linear infinite',
            }}
          />
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px 24px' }}>
          {filtered.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                gap: 12,
                paddingBottom: 40,
              }}
            >
              <span style={{ fontSize: 44, filter: 'grayscale(1)', opacity: 0.4 }}>♟</span>
              <p style={{ fontSize: 14, color: 'var(--text-faint)', textAlign: 'center' }}>
                {EMPTY_MESSAGES[activeTab]}
              </p>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: 10,
                alignContent: 'start',
              }}
            >
              {filtered.map(game => (
                <GameCard
                  key={game.id}
                  game={game}
                  currentPlayerId={user.playerId}
                  loading={joiningId === game.id}
                  cancelling={cancellingId === game.id}
                  onPress={() => handleGamePress(game)}
                  onCancel={() => handleCancelGame(game)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

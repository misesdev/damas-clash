'use client';

import { GameCard } from '../components/GameCard';
import { useHomeScreen } from '../hooks/useHomeScreen';
import type { LoginResponse } from '../types/auth';
import type { GameResponse, GameStatus } from '../types/game';

interface Props {
  user: LoginResponse;
  pendingGame?: GameResponse | null;
  liveGames?: GameResponse[] | null;
  onlineCount?: number | null;
  onGameSelect: (game: GameResponse) => void;
  onGameCancelled?: (gameId: string) => void;
  onOpenOnlinePlayers?: () => void;
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
  onlineCount,
  onGameSelect,
  onGameCancelled,
  onOpenOnlinePlayers,
}: Props) {
  const {
    loading,
    refreshing,
    joiningId,
    cancellingId,
    error,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    filtered,
    handleRefresh,
    handleGamePress,
    handleCancelGame,
  } = useHomeScreen(user, pendingGame, liveGames, onGameSelect, onGameCancelled);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: "100%", overflow: 'hidden' }}>
      {/* ── Toolbar ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '16px 24px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
          maxWidth: 960,
          width: '100%',
          margin: '0 auto',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', gap: 6 }}>
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '7px 16px',
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

        {/* Search field */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            flex: 1,
            maxWidth: 280,
            gap: 8,
            padding: '0 10px',
            height: 34,
            borderRadius: 10,
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            transition: 'border-color 0.15s',
          }}
          onFocusCapture={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--text-muted)'; }}
          onBlurCapture={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'; }}
        >
          <span style={{ fontSize: 13, color: 'var(--text-faint)', flexShrink: 0, lineHeight: 1 }}>⌕</span>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar jogador..."
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              outline: 'none',
              color: 'var(--text)',
              fontSize: 13,
              minWidth: 0,
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-faint)',
                cursor: 'pointer',
                fontSize: 12,
                padding: 0,
                lineHeight: 1,
                flexShrink: 0,
              }}
              title="Limpar"
            >
              ✕
            </button>
          )}
        </div>

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

        {onlineCount != null && (
          <button
            onClick={onOpenOnlinePlayers}
            title="Ver jogadores online"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              borderRadius: 20,
              border: '1px solid var(--border)',
              background: 'var(--surface2)',
              flexShrink: 0,
              cursor: 'pointer',
              transition: 'border-color 0.15s',
            }}
            onMouseOver={e => (e.currentTarget.style.borderColor = 'var(--text-muted)')}
            onMouseOut={e => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: '#4CAF50',
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
              {onlineCount} online
            </span>
          </button>
        )}
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div
          style={{
            margin: '0 auto',
            marginTop: 12,
            padding: '10px 14px',
            borderRadius: 12,
            background: 'var(--danger-bg)',
            border: '1px solid rgba(255,69,58,0.3)',
            color: 'var(--danger)',
            fontSize: 13,
            flexShrink: 0,
            maxWidth: 912,
            width: 'calc(100% - 48px)',
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
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div
            style={{
              maxWidth: 960,
              margin: '0 auto',
              padding: '20px 24px 32px',
            }}
          >
            {filtered.length === 0 ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '80px 0',
                  gap: 12,
                }}
              >
                <span style={{ fontSize: 44, filter: 'grayscale(1)', opacity: 0.4 }}>♟</span>
                <p style={{ fontSize: 14, color: 'var(--text-faint)', textAlign: 'center' }}>
                  {searchQuery.trim()
                    ? 'Nenhuma partida encontrada para esta busca.'
                    : EMPTY_MESSAGES[activeTab]}
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: 12,
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
        </div>
      )}
    </div>
  );
}

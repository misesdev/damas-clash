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
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <p className="text-lg text-white">
          Olá,{' '}
          <span className="font-bold">{user.username}</span>
        </p>
      </div>

      {/* Filter tabs */}
      <div
        className="flex px-4 pb-4 gap-2"
      >
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="rounded-xl px-4 py-2 text-sm font-medium transition-colors"
            style={{
              background: activeTab === tab.key ? 'var(--text)' : 'var(--surface)',
              color: activeTab === tab.key ? 'var(--bg)' : 'var(--text-muted)',
            }}
          >
            {tab.label}
          </button>
        ))}

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="ml-auto rounded-xl px-3 py-2 text-sm transition-opacity hover:opacity-80 disabled:opacity-40"
          style={{ color: 'var(--text-muted)' }}
        >
          {refreshing ? '↻' : '↻'}
        </button>
      </div>

      {/* Content */}
      {error && (
        <p className="mx-4 mb-4 rounded-xl px-4 py-3 text-sm text-red-400"
          style={{ background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)' }}>
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {filtered.length === 0 ? (
            <p className="pt-12 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
              {EMPTY_MESSAGES[activeTab]}
            </p>
          ) : (
            <div className="flex flex-col gap-3">
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

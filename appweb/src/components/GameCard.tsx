'use client';

import type { GameResponse } from '../types/game';

interface GameCardProps {
  game: GameResponse;
  currentPlayerId: string;
  loading?: boolean;
  cancelling?: boolean;
  onPress: () => void;
  onCancel?: () => void;
}

function Avatar({ username, avatarUrl }: { username: string | null; avatarUrl: string | null }) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={username ?? ''}
        className="h-8 w-8 rounded-full object-cover"
      />
    );
  }
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white">
      {(username ?? '?').slice(0, 2).toUpperCase()}
    </div>
  );
}

export function GameCard({
  game,
  currentPlayerId,
  loading,
  cancelling,
  onPress,
  onCancel,
}: GameCardProps) {
  const isParticipant =
    game.playerBlackId === currentPlayerId || game.playerWhiteId === currentPlayerId;
  const isOwner = game.playerBlackId === currentPlayerId;

  const statusLabel =
    game.status === 'WaitingForPlayers' ? 'Aguardando' : 'Em andamento';

  const statusColor =
    game.status === 'WaitingForPlayers' ? 'text-yellow-400' : 'text-green-400';

  const actionLabel =
    game.status === 'InProgress' || isParticipant ? 'Continuar' : 'Entrar';

  return (
    <div
      className="rounded-2xl p-4 transition-colors hover:brightness-110"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Players */}
        <div className="flex flex-1 items-center gap-2 overflow-hidden">
          <Avatar username={game.playerBlackUsername} avatarUrl={game.playerBlackAvatarUrl} />
          <span className="min-w-0 truncate text-sm text-white">
            {game.playerBlackUsername ?? 'Aguardando...'}
          </span>
          <span className="shrink-0 text-xs" style={{ color: 'var(--text-muted)' }}>×</span>
          <Avatar username={game.playerWhiteUsername} avatarUrl={game.playerWhiteAvatarUrl} />
          <span className="min-w-0 truncate text-sm text-white">
            {game.playerWhiteUsername ?? 'Aguardando...'}
          </span>
        </div>

        {/* Status badge */}
        <span className={`shrink-0 text-xs font-medium ${statusColor}`}>{statusLabel}</span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          #{game.id.slice(0, 8).toUpperCase()}
        </span>

        <div className="flex gap-2">
          {isOwner && game.status === 'WaitingForPlayers' && onCancel && (
            <button
              onClick={e => { e.stopPropagation(); onCancel(); }}
              disabled={cancelling}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50"
              style={{ border: '1px solid rgba(231,76,60,0.4)' }}
            >
              {cancelling ? '...' : 'Cancelar'}
            </button>
          )}

          <button
            onClick={onPress}
            disabled={loading}
            className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-black border-t-transparent" />
            ) : (
              actionLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

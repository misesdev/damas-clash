'use client';

import { useTranslation } from 'react-i18next';
import type { GameResponse } from '../types/game';
import '../i18n';

interface GameCardProps {
  game: GameResponse;
  currentPlayerId: string;
  loading?: boolean;
  cancelling?: boolean;
  onPress: () => void;
  onCancel?: () => void;
}

function Avatar({ username, avatarUrl, size = 36 }: { username: string | null; avatarUrl: string | null; size?: number }) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={username ?? ''}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    );
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'var(--surface2)',
        border: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.33,
        fontWeight: 700,
        color: 'var(--text-muted)',
        flexShrink: 0,
      }}
    >
      {(username ?? '?').slice(0, 1).toUpperCase()}
    </div>
  );
}

function PlayerSlot({ username, avatarUrl, align, waitingLabel }: { username: string | null; avatarUrl: string | null; align: 'left' | 'right'; waitingLabel: string }) {
  const isRight = align === 'right';
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isRight ? 'row-reverse' : 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
        overflow: 'hidden',
      }}
    >
      <Avatar username={username} avatarUrl={avatarUrl} />
      <span
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: username ? 'var(--text)' : 'var(--text-faint)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          textAlign: isRight ? 'right' : 'left',
        }}
      >
        {username ?? waitingLabel}
      </span>
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
  const { t } = useTranslation();

  const isParticipant =
    game.playerBlackId === currentPlayerId || game.playerWhiteId === currentPlayerId;
  const isOwner = game.playerBlackId === currentPlayerId;
  const isWaiting = game.status === 'WaitingForPlayers';
  const isInProgress = game.status === 'InProgress';

  let actionLabel: string | null;
  if (isWaiting && !isParticipant) {
    actionLabel = t('gamecard_join');
  } else if (isInProgress && isParticipant) {
    actionLabel = t('gamecard_continue');
  } else if (isInProgress && !isParticipant) {
    actionLabel = t('gamecard_watch');
  } else {
    // Owner waiting — cancel button handles it, no action button needed
    actionLabel = null;
  }

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 18,
        overflow: 'hidden',
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#333'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'; }}
    >
      {/* Players row */}
      <div style={{ padding: '16px 16px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <PlayerSlot username={game.playerBlackUsername} avatarUrl={game.playerBlackAvatarUrl} align="left" waitingLabel={t('gamecard_waiting')} />
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', flexShrink: 0, letterSpacing: 1 }}>
          VS
        </span>
        <PlayerSlot username={game.playerWhiteUsername} avatarUrl={game.playerWhiteAvatarUrl} align="right" waitingLabel={t('gamecard_waiting')} />
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '10px 16px',
          background: 'var(--surface2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        {/* Status pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: isWaiting ? '#f5a623' : '#2ecc71',
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
            {isWaiting ? t('gamecard_statusWaiting') : t('gamecard_statusInProgress')}
          </span>
        </div>

        {(game.betAmountSats ?? 0) > 0 && (
          <span style={{ fontSize: 12, color: '#f5a623', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
            <span>⚡</span>
            {game.betAmountSats!.toLocaleString()}
          </span>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {isOwner && isWaiting && onCancel && (
            <button
              onClick={e => { e.stopPropagation(); onCancel(); }}
              disabled={cancelling}
              style={{
                padding: '5px 12px',
                fontSize: 12,
                fontWeight: 500,
                color: 'var(--danger)',
                background: 'transparent',
                border: '1px solid rgba(255,69,58,0.35)',
                borderRadius: 8,
                cursor: 'pointer',
                opacity: cancelling ? 0.5 : 1,
              }}
            >
              {cancelling ? '...' : t('gamecard_cancel')}
            </button>
          )}

          {actionLabel && (
            <button
              onClick={onPress}
              disabled={loading}
              style={{
                padding: '5px 16px',
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--bg)',
                background: 'var(--text)',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                opacity: loading ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              {loading ? (
                <span
                  style={{
                    display: 'inline-block',
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    border: '2px solid var(--bg)',
                    borderTopColor: 'transparent',
                    animation: 'spin 0.7s linear infinite',
                  }}
                />
              ) : actionLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

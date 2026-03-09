'use client';

import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useOnlinePlayers } from '../hooks/useOnlinePlayers';
import type { OnlinePlayerInfo } from '../types/player';
import '../i18n';

interface Props {
  players: OnlinePlayerInfo[];
  currentPlayerId: string;
  pendingChallengeId: string | null;
  onClose: () => void;
  onChallenge: (playerId: string) => void;
  onCancelChallenge: (playerId: string) => void;
  onWatch: (gameId: string) => void;
}

function PlayerAvatar({ username, avatarUrl, size = 40 }: { username: string; avatarUrl?: string | null; size?: number }) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={username}
        style={{ width: size, height: size, borderRadius: size / 2, objectFit: 'cover', flexShrink: 0 }}
      />
    );
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        background: 'var(--surface2)',
        border: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        fontSize: size * 0.38,
        fontWeight: 700,
        color: 'var(--text)',
      }}
    >
      {username[0]?.toUpperCase() ?? '?'}
    </div>
  );
}

function PlayerRow({
  player,
  isPending,
  onChallenge,
  onCancelChallenge,
  onWatch,
}: {
  player: OnlinePlayerInfo;
  isPending: boolean;
  onChallenge: () => void;
  onCancelChallenge: () => void;
  onWatch: () => void;
}) {
  const { t } = useTranslation();
  const isInGame = player.status === 'InGame';

  const actionBtn = isInGame ? (
    <button
      onClick={onWatch}
      style={{
        padding: '6px 14px',
        borderRadius: 8,
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer',
        border: '1px solid var(--border)',
        background: 'var(--surface2)',
        color: 'var(--text-muted)',
        flexShrink: 0,
        whiteSpace: 'nowrap',
      }}
    >
      {t('online_watch')}
    </button>
  ) : isPending ? (
    <button
      onClick={onCancelChallenge}
      style={{
        padding: '6px 14px',
        borderRadius: 8,
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer',
        border: '1px solid var(--border)',
        background: 'var(--surface2)',
        color: 'var(--text-faint)',
        flexShrink: 0,
        whiteSpace: 'nowrap',
      }}
      title={t('online_cancelHint')}
    >
      {t('online_waiting')}
    </button>
  ) : (
    <button
      onClick={onChallenge}
      style={{
        padding: '6px 14px',
        borderRadius: 8,
        fontSize: 12,
        fontWeight: 700,
        cursor: 'pointer',
        border: 'none',
        background: 'var(--text)',
        color: 'var(--bg)',
        flexShrink: 0,
        whiteSpace: 'nowrap',
      }}
    >
      {t('online_challenge')}
    </button>
  );

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 0',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <PlayerAvatar username={player.username} avatarUrl={player.avatarUrl} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {player.username}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: isInGame ? '#FF9800' : '#4CAF50',
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: isInGame ? '#FF9800' : '#4CAF50',
            }}
          >
            {isInGame ? t('online_inGame') : t('online_online')}
          </span>
        </div>
      </div>
      {actionBtn}
    </div>
  );
}

export function OnlinePlayersModal({
  players,
  currentPlayerId,
  pendingChallengeId,
  onClose,
  onChallenge,
  onCancelChallenge,
  onWatch,
}: Props) {
  const { t } = useTranslation();
  const { searchQuery, setSearchQuery, filtered } = useOnlinePlayers(players, currentPlayerId);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus search on open
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 60);
    return () => clearTimeout(timer);
  }, []);

  const othersCount = players.filter(p => p.playerId !== currentPlayerId).length;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: 24,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          width: '100%',
          maxWidth: 440,
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.8)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 20px 16px',
            borderBottom: '1px solid var(--border)',
            flexShrink: 0,
          }}
        >
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>
              {t('online_title')}
            </h2>
            <p style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 2 }}>
              {othersCount === 1
                ? t('online_count_singular', { count: othersCount })
                : t('online_count_plural', { count: othersCount })}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: '12px 20px 0', flexShrink: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '0 10px',
              height: 36,
              borderRadius: 10,
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
            }}
          >
            <span style={{ fontSize: 13, color: 'var(--text-faint)', flexShrink: 0 }}>⌕</span>
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t('online_search')}
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                outline: 'none',
                color: 'var(--text)',
                fontSize: 13,
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ background: 'none', border: 'none', color: 'var(--text-faint)', cursor: 'pointer', fontSize: 12, padding: 0 }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 20px 20px' }}>
          {filtered.length === 0 ? (
            <p
              style={{
                color: 'var(--text-faint)',
                fontSize: 14,
                textAlign: 'center',
                marginTop: 40,
              }}
            >
              {searchQuery.trim() ? t('online_emptySearch') : t('online_emptyList')}
            </p>
          ) : (
            filtered.map(player => (
              <PlayerRow
                key={player.playerId}
                player={player}
                isPending={pendingChallengeId === player.playerId}
                onChallenge={() => onChallenge(player.playerId)}
                onCancelChallenge={() => onCancelChallenge(player.playerId)}
                onWatch={() => player.gameId && onWatch(player.gameId)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

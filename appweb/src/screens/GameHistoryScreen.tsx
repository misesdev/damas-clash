'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getPlayerGames } from '../api/games';
import type { LoginResponse } from '../types/auth';
import type { GameResponse } from '../types/game';
import '../i18n';

interface Props {
  user: LoginResponse;
  onReplay: (game: GameResponse) => void;
  onBack: () => void;
}

function Avatar({ username, avatarUrl, size = 36 }: { username: string | null; avatarUrl: string | null; size?: number }) {
  if (avatarUrl) {
    return <img src={avatarUrl} alt={username ?? ''} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />;
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'var(--surface2)', border: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 700, color: 'var(--text-muted)', flexShrink: 0,
    }}>
      {(username ?? '?')[0].toUpperCase()}
    </div>
  );
}

export function GameHistoryScreen({ user, onReplay, onBack }: Props) {
  const { t, i18n } = useTranslation();
  const [games, setGames] = useState<GameResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPlayerGames(user.token, user.playerId)
      .then(setGames)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user.token, user.playerId]);

  const wins = games.filter(g => g.winnerId === user.playerId).length;
  const losses = games.filter(g => g.winnerId !== null && g.winnerId !== user.playerId).length;

  const formatDate = (iso: string) => {
    const locale = i18n.language === 'pt' ? 'pt-BR' : 'en-US';
    return new Date(iso).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)', overflowY: 'auto' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', width: '100%', padding: '32px 24px 48px' }}>

        {/* Back */}
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text-muted)', padding: 0, marginBottom: 28, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <span style={{ fontSize: 16 }}>←</span> {t('history_back')}
        </button>

        {/* Heading */}
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>
          {t('history_title')}
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 28 }}>
          {t('history_subtitle')}
        </p>

        {/* Stats */}
        {!loading && games.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 28 }}>
            {[
              { label: t('history_statGames'), value: games.length },
              { label: t('history_statWins'), value: wins },
              { label: t('history_statLosses'), value: losses },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 10px', textAlign: 'center' }}>
                <p style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>{s.value}</p>
                <p style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 5, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* List */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.12)', borderTopColor: 'white', animation: 'spin 0.7s linear infinite' }} />
          </div>
        ) : games.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-faint)', fontSize: 14 }}>
            <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.4 }}>♟</div>
            {t('history_empty')}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {games.map(game => {
              const isBlack = game.playerBlackId === user.playerId;
              const opponent = isBlack
                ? { username: game.playerWhiteUsername, avatarUrl: game.playerWhiteAvatarUrl }
                : { username: game.playerBlackUsername, avatarUrl: game.playerBlackAvatarUrl };
              const won = game.winnerId === user.playerId;
              const drew = game.winnerId === null;

              return (
                <div
                  key={game.id}
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 16,
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  {/* Result badge */}
                  <div style={{
                    width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                    background: drew ? 'var(--surface2)' : won ? 'rgba(46,204,113,0.12)' : 'rgba(255,69,58,0.1)',
                    border: `1px solid ${drew ? 'var(--border)' : won ? 'rgba(46,204,113,0.35)' : 'rgba(255,69,58,0.3)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16,
                  }}>
                    {drew ? '—' : won ? '✓' : '✗'}
                  </div>

                  {/* Opponent */}
                  <Avatar username={opponent.username} avatarUrl={opponent.avatarUrl} size={34} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {opponent.username ?? t('history_unknown')}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      {formatDate(game.updatedAt)}
                    </p>
                  </div>

                  {/* Result label */}
                  <span style={{
                    fontSize: 12, fontWeight: 700, flexShrink: 0,
                    color: drew ? 'var(--text-muted)' : won ? '#2ecc71' : 'var(--danger)',
                  }}>
                    {drew ? t('history_draw') : won ? t('history_win') : t('history_loss')}
                  </span>

                  {/* Replay button */}
                  <button
                    onClick={() => onReplay(game)}
                    style={{
                      padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                      background: 'var(--surface2)', border: '1px solid var(--border)',
                      color: 'var(--text)', cursor: 'pointer', flexShrink: 0,
                    }}
                  >
                    {t('history_replay')}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

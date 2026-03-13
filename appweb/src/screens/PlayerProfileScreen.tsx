'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getPlayerGames, getPlayerStats } from '../api/games';
import type { LoginResponse } from '../types/auth';
import type { GameResponse, PlayerStats } from '../types/game';
import '../i18n';

interface Props {
  session: LoginResponse;
  profilePlayerId: string;
  profileUsername: string;
  profileAvatarUrl?: string | null;
  onBack: () => void;
}

function PlayerAvatar({ username, avatarUrl, size = 88 }: { username: string; avatarUrl?: string | null; size?: number }) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={username}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: 0,
          border: '3px solid var(--border)',
        }}
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
        border: '3px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        fontSize: size * 0.34,
        fontWeight: 800,
        color: 'var(--text)',
        letterSpacing: 1,
      }}
    >
      {username.slice(0, 2).toUpperCase()}
    </div>
  );
}

function MiniAvatar({ username, avatarUrl }: { username: string | null; avatarUrl: string | null }) {
  const size = 26;
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={username ?? '?'}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1px solid var(--border)' }}
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
        flexShrink: 0,
        fontSize: 9,
        fontWeight: 700,
        color: 'var(--text-muted)',
      }}
    >
      {(username ?? '?').slice(0, 2).toUpperCase()}
    </div>
  );
}

function GameRow({ game, profilePlayerId }: { game: GameResponse; profilePlayerId: string }) {
  const { t } = useTranslation();

  const isBlack = game.playerBlackId === profilePlayerId;
  const profileName = isBlack ? game.playerBlackUsername : game.playerWhiteUsername;
  const profileAvatar = isBlack ? game.playerBlackAvatarUrl : game.playerWhiteAvatarUrl;
  const oppName = isBlack ? game.playerWhiteUsername : game.playerBlackUsername;
  const oppAvatar = isBlack ? game.playerWhiteAvatarUrl : game.playerBlackAvatarUrl;

  const won = game.winnerId === profilePlayerId;
  const drew = game.winnerId === null;
  const resultLabel = drew ? t('playerProfile_draw') : won ? t('playerProfile_win') : t('playerProfile_loss');
  const resultColor = drew ? 'var(--text-muted)' : won ? '#2ecc71' : 'var(--danger)';
  const betLabel = (game.betAmountSats ?? 0) > 0
    ? `⚡ ${game.betAmountSats!.toLocaleString()} sats`
    : t('playerProfile_friendly');

  return (
    <div
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
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          flexShrink: 0,
          background: drew ? 'var(--surface2)' : won ? 'rgba(46,204,113,0.12)' : 'rgba(255,69,58,0.1)',
          border: `1px solid ${drew ? 'var(--border)' : won ? 'rgba(46,204,113,0.35)' : 'rgba(255,69,58,0.3)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 16,
          color: resultColor,
          fontWeight: 700,
        }}
      >
        {drew ? '—' : won ? '✓' : '✗'}
      </div>

      {/* Players vs */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Left player */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            <MiniAvatar username={profileName} avatarUrl={profileAvatar} />
            <span
              style={{
                flex: 1,
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {profileName ?? '—'}
            </span>
          </div>

          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--text-faint)',
              flexShrink: 0,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            vs
          </span>

          {/* Right player */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, minWidth: 0 }}>
            <span
              style={{
                flex: 1,
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                textAlign: 'right',
              }}
            >
              {oppName ?? '—'}
            </span>
            <MiniAvatar username={oppName} avatarUrl={oppAvatar} />
          </div>
        </div>

        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{betLabel}</p>
      </div>

      {/* Result label */}
      <span style={{ fontSize: 12, fontWeight: 700, color: resultColor, flexShrink: 0 }}>
        {resultLabel}
      </span>
    </div>
  );
}

export function PlayerProfileScreen({ session, profilePlayerId, profileUsername, profileAvatarUrl, onBack }: Props) {
  const { t } = useTranslation();
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [games, setGames] = useState<GameResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getPlayerStats(session.token, profilePlayerId),
      getPlayerGames(session.token, profilePlayerId),
    ])
      .then(([s, g]) => {
        setStats(s);
        setGames(g.filter(game => game.status === 'Completed'));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session.token, profilePlayerId]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)', overflowY: 'auto' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', width: '100%', padding: '32px 24px 48px' }}>

        {/* Back button */}
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 13,
            color: 'var(--text-muted)',
            padding: 0,
            marginBottom: 32,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span style={{ fontSize: 16 }}>←</span>
          {t('playerProfile_back')}
        </button>

        {/* Profile hero */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 14,
            marginBottom: 32,
            paddingBottom: 32,
            borderBottom: '1px solid var(--border)',
          }}
        >
          <PlayerAvatar username={profileUsername} avatarUrl={profileAvatarUrl} size={88} />
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', lineHeight: 1.2 }}>
              {profileUsername}
            </h1>
          </div>
        </div>

        {/* Stats */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                border: '2px solid rgba(255,255,255,0.12)',
                borderTopColor: 'white',
                animation: 'spin 0.7s linear infinite',
              }}
            />
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 32 }}>
              {[
                { label: t('playerProfile_statGames'), value: stats?.total ?? 0 },
                { label: t('playerProfile_statWins'), value: stats?.wins ?? 0 },
                { label: t('playerProfile_statLosses'), value: stats?.losses ?? 0 },
              ].map(s => (
                <div
                  key={s.label}
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 14,
                    padding: '14px 10px',
                    textAlign: 'center',
                  }}
                >
                  <p style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>{s.value}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {s.label}
                  </p>
                </div>
              ))}
            </div>

            {/* History section */}
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: 1,
                marginBottom: 12,
              }}
            >
              {t('playerProfile_historyTitle')}
            </p>

            {games.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-faint)', fontSize: 14 }}>
                <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.4 }}>♟</div>
                {t('playerProfile_historyEmpty')}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {games.map(game => (
                  <GameRow key={game.id} game={game} profilePlayerId={profilePlayerId} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

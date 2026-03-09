'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getGameMoves } from '../api/games';
import { BOARD_SIZE, createInitialPieces, isDarkSquare } from '../game/checkers';
import { GameEngine } from '../game/GameEngine';
import type { LoginResponse } from '../types/auth';
import type { GameResponse, MoveResponse } from '../types/game';
import '../i18n';

interface Props {
  game: GameResponse;
  session: LoginResponse;
  onBack: () => void;
}

function PlayerAvatar({ username, avatarUrl, size = 36 }: { username?: string | null; avatarUrl?: string | null; size?: number }) {
  if (avatarUrl) {
    return <img src={avatarUrl} alt={username ?? ''} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />;
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'var(--surface2)', border: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 700, color: 'var(--text)', flexShrink: 0,
    }}>
      {(username ?? '?')[0].toUpperCase()}
    </div>
  );
}

export function ReplayScreen({ game, session, onBack }: Props) {
  const { t } = useTranslation();
  const [engines, setEngines] = useState<GameEngine[]>([GameEngine.initial()]);
  const [moves, setMoves] = useState<MoveResponse[]>([]);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const boardSize = typeof window !== 'undefined'
    ? Math.min(window.innerWidth - 48, window.innerHeight - 320, 500)
    : 400;
  const cellSize = boardSize / BOARD_SIZE;
  const pieceSize = Math.round(cellSize * 0.76);

  // Load moves and pre-compute all board states
  useEffect(() => {
    getGameMoves(session.token, game.id)
      .then(fetchedMoves => {
        setMoves(fetchedMoves);
        const states: GameEngine[] = [GameEngine.fromPieces(createInitialPieces(), 'dark', null)];
        let e = GameEngine.fromPieces(createInitialPieces(), 'dark', null);
        for (const mv of fetchedMoves) {
          if (!e.pendingCaptureId) {
            e = e.selectPiece(mv.fromRow, mv.fromCol);
          }
          const result = e.applyMoveAt(mv.toRow, mv.toCol);
          if (result) e = result.nextEngine;
          states.push(e);
        }
        setEngines(states);
        setPlaying(true); // auto-start
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [game.id, session.token]);

  // Auto-play interval
  useEffect(() => {
    if (!playing) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setStep(s => {
        if (s >= engines.length - 1) {
          setPlaying(false);
          return s;
        }
        return s + 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [playing, engines.length]);

  const engine = engines[step] ?? GameEngine.initial();
  const isAtEnd = step >= engines.length - 1;
  const isAtStart = step === 0;

  const togglePlay = () => {
    if (isAtEnd) { setStep(0); setPlaying(true); return; }
    setPlaying(p => !p);
  };

  const stepBack = () => { if (!isAtStart) { setStep(s => s - 1); setPlaying(false); } };
  const stepForward = () => { if (!isAtEnd) { setStep(s => s + 1); setPlaying(false); } };
  const jumpStart = () => { setStep(0); setPlaying(false); };
  const jumpEnd = () => { setStep(engines.length - 1); setPlaying(false); };

  const winner = game.winnerId === game.playerBlackId
    ? game.playerBlackUsername
    : game.winnerId === game.playerWhiteId
    ? game.playerWhiteUsername
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)', overflowY: 'auto' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', width: '100%', padding: '24px 20px 48px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>

        {/* Back */}
        <div style={{ width: '100%' }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text-muted)', padding: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 16 }}>←</span> {t('replay_back')}
          </button>
        </div>

        {/* Players header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, width: '100%', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <PlayerAvatar username={game.playerBlackUsername} avatarUrl={game.playerBlackAvatarUrl} />
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{game.playerBlackUsername ?? '—'}</span>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', letterSpacing: 1 }}>VS</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <PlayerAvatar username={game.playerWhiteUsername} avatarUrl={game.playerWhiteAvatarUrl} />
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{game.playerWhiteUsername ?? '—'}</span>
          </div>
        </div>

        {/* Move counter */}
        <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
          {loading ? t('replay_loading') : t('replay_move', { step, total: moves.length })}
        </p>

        {/* Winner banner */}
        {isAtEnd && winner && (
          <div style={{
            padding: '10px 20px', borderRadius: 12, textAlign: 'center',
            background: 'rgba(46,204,113,0.1)', border: '1px solid rgba(46,204,113,0.3)',
            color: '#2ecc71', fontSize: 14, fontWeight: 700,
          }}>
            {t('replay_won', { name: winner })}
          </div>
        )}

        {/* Board */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.12)', borderTopColor: 'white', animation: 'spin 0.7s linear infinite' }} />
          </div>
        ) : (
          <div style={{ background: '#2e1a0a', borderRadius: 16, padding: 10, border: '2px solid #5a3515', boxShadow: '0 12px 40px rgba(0,0,0,0.7)', display: 'inline-block' }}>
            <div style={{ position: 'relative', width: boardSize, height: boardSize, borderRadius: 8, overflow: 'hidden' }}>
              {/* Cells */}
              {Array.from({ length: BOARD_SIZE }, (_, row) =>
                Array.from({ length: BOARD_SIZE }, (_, col) => (
                  <div
                    key={`${row}-${col}`}
                    style={{
                      position: 'absolute', width: cellSize, height: cellSize,
                      left: col * cellSize, top: row * cellSize,
                      background: isDarkSquare(row, col) ? '#b58863' : '#f0d9b5',
                    }}
                  />
                ))
              )}

              {/* Pieces */}
              {engine.pieces.map(piece => (
                <div
                  key={piece.id}
                  style={{
                    position: 'absolute',
                    width: cellSize, height: cellSize,
                    left: piece.col * cellSize, top: piece.row * cellSize,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    pointerEvents: 'none',
                  }}
                >
                  <div style={{
                    width: pieceSize, height: pieceSize, borderRadius: '50%',
                    background: piece.color === 'dark'
                      ? 'radial-gradient(circle at 35% 35%, #3a3f4f, #0d0f18)'
                      : 'radial-gradient(circle at 35% 35%, #ffffff, #c8c8c8)',
                    border: piece.color === 'dark' ? '2px solid #555' : '2px solid #999',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {piece.isKing && (
                      <span style={{ fontSize: pieceSize * 0.38, color: piece.color === 'dark' ? '#ffd700' : '#333', lineHeight: 1 }}>♛</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Controls */}
        {!loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {[
              { label: '|◀', action: jumpStart, disabled: isAtStart },
              { label: '◀', action: stepBack, disabled: isAtStart },
              { label: playing ? '⏸' : isAtEnd ? '↺' : '▶', action: togglePlay, primary: true },
              { label: '▶', action: stepForward, disabled: isAtEnd },
              { label: '▶|', action: jumpEnd, disabled: isAtEnd },
            ].map((btn, i) => (
              <button
                key={i}
                onClick={btn.action}
                disabled={btn.disabled}
                style={{
                  width: btn.primary ? 52 : 40, height: btn.primary ? 52 : 40,
                  borderRadius: btn.primary ? '50%' : 10,
                  background: btn.primary ? 'var(--text)' : 'var(--surface)',
                  color: btn.primary ? 'var(--bg)' : 'var(--text)',
                  border: btn.primary ? 'none' : '1px solid var(--border)',
                  fontSize: btn.primary ? 18 : 14,
                  cursor: btn.disabled ? 'default' : 'pointer',
                  opacity: btn.disabled ? 0.3 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {btn.label}
              </button>
            ))}
          </div>
        )}

        {/* Progress bar */}
        {!loading && moves.length > 0 && (
          <div style={{ width: '100%', maxWidth: boardSize, height: 3, background: 'var(--surface2)', borderRadius: 2 }}>
            <div style={{ width: `${(step / moves.length) * 100}%`, height: '100%', background: 'var(--text)', borderRadius: 2, transition: 'width 0.3s ease' }} />
          </div>
        )}
      </div>
    </div>
  );
}

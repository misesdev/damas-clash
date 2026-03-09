'use client';

import { useTranslation } from 'react-i18next';
import { BOARD_SIZE, findAt, isDarkSquare } from '../game/checkers';
import { useGameBoard } from '../hooks/useGameBoard';
import type { LoginResponse } from '../types/auth';
import type { GameResponse } from '../types/game';
import '../i18n';

export interface CheckersBoardScreenProps {
  game: GameResponse;
  session: LoginResponse;
  onBack: () => void;
}

function PlayerAvatar({
  avatarUrl,
  username,
  size = 40,
}: {
  avatarUrl?: string | null;
  username?: string | null;
  size?: number;
}) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={username ?? ''}
        style={{ width: size, height: size, borderRadius: size / 2, objectFit: 'cover', flexShrink: 0 }}
      />
    );
  }
  const initial = username ? username[0].toUpperCase() : '?';
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
        color: 'var(--text)',
        fontSize: size * 0.4,
        fontWeight: 700,
      }}
    >
      {initial}
    </div>
  );
}

function PlayerChip({
  username,
  avatarUrl,
  pieceCount,
  label,
  active,
}: {
  username?: string | null;
  avatarUrl?: string | null;
  pieceCount: number;
  label: string;
  active: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 14px',
        borderRadius: 14,
        background: 'var(--surface)',
        border: `1px solid ${active ? 'var(--text)' : 'var(--border)'}`,
        transition: 'border-color 0.2s',
      }}
    >
      <PlayerAvatar avatarUrl={avatarUrl} username={username} size={36} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 10, color: 'var(--text-faint)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', lineHeight: 1.2 }}>{label}</p>
        <p style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{username ?? '—'}</p>
      </div>
      <span style={{ fontSize: 18, fontWeight: 800, color: active ? 'var(--text)' : 'var(--text-muted)', flexShrink: 0 }}>
        {pieceCount}
      </span>
    </div>
  );
}

export function CheckersBoardScreen({ game, session, onBack }: CheckersBoardScreenProps) {
  const { t } = useTranslation();
  const {
    game: liveGame,
    engine,
    myColor,
    isFlipped,
    myUsername,
    opponentUsername,
    myAvatarUrl,
    opponentAvatarUrl,
    isMyTurn,
    spectator,
    timeLeft,
    isTimerActive,
    isUrgent,
    winner,
    watchersCount,
    sendingMove,
    error,
    boardSize,
    cellSize,
    animating,
    piecePositions,
    myCount,
    oppCount,
    darkCount,
    lightCount,
    handleCellPress,
    confirmResign,
  } = useGameBoard(game, session);

  const {
    pieces,
    mustCapture,
    pendingCaptureId,
    activeId,
    selectedPiece,
    validMoveMap,
    capturingPieceIds,
  } = engine;

  const capturingSet = new Set(capturingPieceIds);
  const pieceSize = Math.round(cellSize * 0.78);

  const isDarkTurn = liveGame.currentTurn === 'Black';
  const leftUsername = spectator ? liveGame.playerBlackUsername : myUsername;
  const rightUsername = spectator ? liveGame.playerWhiteUsername : opponentUsername;
  const leftAvatarUrl = spectator ? liveGame.playerBlackAvatarUrl : myAvatarUrl;
  const rightAvatarUrl = spectator ? liveGame.playerWhiteAvatarUrl : opponentAvatarUrl;
  const leftLabel = spectator ? t('board_black') : t('board_you');
  const rightLabel = spectator ? t('board_white') : t('board_opponent');
  const leftCount = spectator ? darkCount : myCount;
  const rightCount = spectator ? lightCount : oppCount;
  const leftActive = spectator ? (isDarkTurn && !winner) : (isMyTurn && !winner);
  const rightActive = spectator ? (!isDarkTurn && !winner) : (!isMyTurn && !winner);

  const statusText = () => {
    if (spectator) {
      if (winner) {
        const winnerName = liveGame.winnerId === liveGame.playerBlackId
          ? liveGame.playerBlackUsername
          : liveGame.playerWhiteUsername;
        return t('board_spectatorWonStatus', { name: winnerName ?? t('board_defaultPlayer') });
      }
      const turnName = isDarkTurn ? liveGame.playerBlackUsername : liveGame.playerWhiteUsername;
      return t('board_spectatorTurnOf', { name: turnName ?? t('board_defaultPlayer') });
    }
    if (winner) return winner === myColor ? t('board_youWon') : t('board_youLost');
    if (sendingMove) return t('board_sending');
    if (pendingCaptureId) return t('board_multiCapture');
    if (mustCapture) return t('board_mandatoryCapture');
    return isMyTurn ? t('board_yourTurn') : t('board_opponentTurn', { opponent: opponentUsername ?? t('board_opponent') });
  };

  // Board DOM
  const boardEl = (
    <div
      style={{
        background: '#2e1a0a',
        borderRadius: 16,
        padding: 10,
        border: '2px solid #5a3515',
        boxShadow: '0 12px 40px rgba(0,0,0,0.7)',
        display: 'inline-block',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: boardSize,
          height: boardSize,
          borderRadius: 8,
          overflow: 'hidden',
          transform: isFlipped ? 'rotate(180deg)' : undefined,
        }}
      >
        {/* Cells */}
        {Array.from({ length: BOARD_SIZE }, (_, row) =>
          Array.from({ length: BOARD_SIZE }, (_, col) => {
            const dark = isDarkSquare(row, col);
            const isTarget = validMoveMap.has(`${row}-${col}`);
            const hasPiece = !!findAt(pieces, row, col);
            const isSelectedCell = selectedPiece?.row === row && selectedPiece?.col === col;

            return (
              <div
                key={`${row}-${col}`}
                onClick={() => handleCellPress(row, col)}
                style={{
                  position: 'absolute',
                  width: cellSize,
                  height: cellSize,
                  left: col * cellSize,
                  top: row * cellSize,
                  background: dark
                    ? isSelectedCell ? '#cdd16f' : '#b58863'
                    : '#f0d9b5',
                  cursor: dark ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isTarget && !hasPiece && (
                  <div
                    style={{
                      width: cellSize * 0.3,
                      height: cellSize * 0.3,
                      borderRadius: '50%',
                      background: 'rgba(0,0,0,0.22)',
                    }}
                  />
                )}
                {isTarget && hasPiece && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 3,
                      borderRadius: '50%',
                      border: '3px solid rgba(220,50,50,0.7)',
                    }}
                  />
                )}
              </div>
            );
          }),
        )}

        {/* Pieces */}
        {pieces.map(piece => {
          const pos = piecePositions.get(piece.id);
          const displayRow = pos?.row ?? piece.row;
          const displayCol = pos?.col ?? piece.col;
          const opacity = pos?.opacity ?? 1;
          const isSelected = piece.id === activeId;
          const isMandatory = !isSelected && capturingSet.has(piece.id);

          return (
            <div
              key={piece.id}
              style={{
                position: 'absolute',
                width: cellSize,
                height: cellSize,
                left: displayCol * cellSize,
                top: displayRow * cellSize,
                opacity,
                transition: animating ? 'left 0.22s ease, top 0.22s ease, opacity 0.2s ease' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
                zIndex: isSelected ? 10 : 1,
              }}
            >
              <div style={{ transform: isFlipped ? 'rotate(180deg)' : undefined, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                {isSelected && (
                  <div
                    style={{
                      position: 'absolute',
                      width: pieceSize + 10,
                      height: pieceSize + 10,
                      border: '2.5px solid rgba(212,168,67,0.9)',
                      borderRadius: '50%',
                    }}
                  />
                )}
                {isMandatory && (
                  <div
                    style={{
                      position: 'absolute',
                      width: pieceSize + 10,
                      height: pieceSize + 10,
                      border: '2.5px solid rgba(220,70,70,0.85)',
                      borderRadius: '50%',
                    }}
                  />
                )}
                <div
                  style={{
                    width: pieceSize,
                    height: pieceSize,
                    borderRadius: '50%',
                    background: piece.color === 'dark'
                      ? 'radial-gradient(circle at 35% 35%, #3a3f4f, #0d0f18)'
                      : 'radial-gradient(circle at 35% 35%, #ffffff, #d8d0c4)',
                    boxShadow: piece.color === 'dark'
                      ? '0 3px 8px rgba(0,0,0,0.7), inset 0 1px 3px rgba(255,255,255,0.1)'
                      : '0 3px 8px rgba(0,0,0,0.3), inset 0 1px 3px rgba(255,255,255,0.9)',
                    border: isSelected
                      ? '2px solid #d4a843'
                      : piece.color === 'dark' ? '2px solid #0d0f18' : '2px solid #c8bca8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {piece.isKing && (
                    <span
                      style={{
                        fontSize: pieceSize * 0.45,
                        color: piece.color === 'dark' ? '#c9a84c' : '#7a5a18',
                        lineHeight: 1,
                        userSelect: 'none',
                      }}
                    >
                      ♛
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ── Win overlay ─────────────────────────────────────────────────────────────
  const winnerName = liveGame.winnerId === liveGame.playerBlackId
    ? liveGame.playerBlackUsername
    : liveGame.playerWhiteUsername;

  const winOverlay = winner ? (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.92)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: 32,
      }}
    >
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, maxWidth: 400 }}>
        {spectator ? (
          <>
            <span style={{ fontSize: 72 }}>🏆</span>
            <h2 style={{ fontSize: 40, fontWeight: 800, color: '#ffffff', letterSpacing: 0.5 }}>
              {t('board_gameOver')}
            </h2>
            <p style={{ fontSize: 16, color: '#888888' }}>
              {t('board_spectatorWonDetail', { name: winnerName ?? t('board_defaultPlayer') })}
            </p>
          </>
        ) : (
          <>
            <span style={{ fontSize: 72 }}>{winner === myColor ? '🏆' : '💔'}</span>
            <h2 style={{ fontSize: 40, fontWeight: 800, color: winner === myColor ? '#ffffff' : '#888888', letterSpacing: 0.5 }}>
              {winner === myColor ? t('board_victory') : t('board_defeat')}
            </h2>
            <p style={{ fontSize: 16, color: '#888888' }}>
              {winner === myColor
                ? t('board_congratulations')
                : t('board_opponentWon', { name: opponentUsername ?? t('board_opponent') })}
            </p>
          </>
        )}
        <button
          onClick={onBack}
          style={{
            marginTop: 8,
            background: '#ffffff',
            color: '#0c0c0c',
            border: 'none',
            borderRadius: 12,
            padding: '12px 32px',
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {t('board_backToHome')}
        </button>
      </div>
    </div>
  ) : null;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--bg)',
        overflow: 'hidden',
      }}
    >
      {/* Top bar */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={winner || spectator ? onBack : undefined}
            title={winner || spectator ? t('board_backToHome') : undefined}
            style={{
              background: 'none',
              border: 'none',
              color: winner || spectator ? 'var(--text)' : 'var(--text-faint)',
              cursor: winner || spectator ? 'pointer' : 'default',
              fontSize: 20,
              lineHeight: 1,
              padding: 4,
            }}
          >
            ←
          </button>
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', letterSpacing: 1 }}>DAMAS</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-faint)', fontSize: 12 }}>
          <span>👁</span>
          <span>{watchersCount} {watchersCount === 1 ? t('board_spectator_singular') : t('board_spectator_plural')}</span>
        </div>
      </header>

      {error && (
        <div style={{ padding: '8px 20px', background: 'var(--danger-bg)', borderBottom: '1px solid rgba(255,69,58,0.3)', fontSize: 13, color: '#ff453a', flexShrink: 0 }}>
          {error}
        </div>
      )}

      {/* Main area */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px 16px',
          gap: 32,
        }}
      >
        {/* === DESKTOP: Left panel === */}
        <div
          className="hidden md:flex"
          style={{ flexDirection: 'column', gap: 16, width: 200, flexShrink: 0 }}
        >
          <PlayerChip
            username={rightUsername}
            avatarUrl={rightAvatarUrl}
            pieceCount={rightCount}
            label={rightLabel}
            active={rightActive}
          />
          <div style={{ flex: 1 }} />
          <PlayerChip
            username={leftUsername}
            avatarUrl={leftAvatarUrl}
            pieceCount={leftCount}
            label={leftLabel}
            active={leftActive}
          />
        </div>

        {/* Board */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          {/* Mobile chips above board */}
          <div className="flex md:hidden" style={{ gap: 8, width: '100%', maxWidth: boardSize + 20 }}>
            <div style={{ flex: 1 }}>
              <PlayerChip
                username={leftUsername}
                avatarUrl={leftAvatarUrl}
                pieceCount={leftCount}
                label={leftLabel}
                active={leftActive}
              />
            </div>
            <span style={{ color: 'var(--text-faint)', alignSelf: 'center', fontSize: 14 }}>×</span>
            <div style={{ flex: 1 }}>
              <PlayerChip
                username={rightUsername}
                avatarUrl={rightAvatarUrl}
                pieceCount={rightCount}
                label={rightLabel}
                active={rightActive}
              />
            </div>
          </div>

          {boardEl}

          {/* Status + timer below board */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: 28 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: isUrgent ? 'var(--danger)' : 'var(--text-muted)' }}>
              {statusText()}
            </span>
            {isTimerActive && (
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: isUrgent ? 'var(--danger)' : 'var(--text)',
                  fontVariantNumeric: 'tabular-nums',
                  minWidth: 36,
                }}
              >
                {timeLeft}s
              </span>
            )}
          </div>

          {/* Resign or leave: mobile only */}
          {liveGame.status === 'InProgress' && !winner && !spectator && (
            <button
              className="flex md:hidden"
              onClick={confirmResign}
              disabled={sendingMove}
              style={{
                background: 'transparent',
                color: 'var(--danger)',
                border: '1px solid rgba(255,69,58,0.4)',
                borderRadius: 12,
                padding: '8px 24px',
                fontSize: 13,
                fontWeight: 600,
                cursor: sendingMove ? 'not-allowed' : 'pointer',
                opacity: sendingMove ? 0.5 : 1,
              }}
            >
              {t('board_resign')}
            </button>
          )}
          {spectator && liveGame.status === 'InProgress' && (
            <button
              className="flex md:hidden"
              onClick={onBack}
              style={{
                background: 'transparent',
                color: 'var(--text-muted)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '8px 24px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {t('board_leave')}
            </button>
          )}
        </div>

        {/* === DESKTOP: Right panel === */}
        <div
          className="hidden md:flex"
          style={{ flexDirection: 'column', gap: 16, width: 200, flexShrink: 0, alignSelf: 'stretch', paddingTop: 4 }}
        >
          {/* Status card */}
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 14,
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <p style={{ fontSize: 11, color: 'var(--text-faint)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('board_status')}</p>
            <p style={{ fontSize: 14, fontWeight: 700, color: isUrgent ? 'var(--danger)' : 'var(--text)' }}>
              {statusText()}
            </p>
            {isTimerActive && (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontSize: 36, fontWeight: 800, color: isUrgent ? 'var(--danger)' : 'var(--text)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                  {timeLeft}
                </span>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>s</span>
              </div>
            )}
          </div>

          <div style={{ flex: 1 }} />

          {/* Resign or leave button — desktop */}
          {liveGame.status === 'InProgress' && !winner && !spectator && (
            <button
              onClick={confirmResign}
              disabled={sendingMove}
              style={{
                background: 'transparent',
                color: 'var(--danger)',
                border: '1px solid rgba(255,69,58,0.4)',
                borderRadius: 12,
                padding: '10px 16px',
                fontSize: 14,
                fontWeight: 600,
                cursor: sendingMove ? 'not-allowed' : 'pointer',
                opacity: sendingMove ? 0.5 : 1,
                transition: 'background 0.15s',
              }}
              onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,69,58,0.08)')}
              onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
            >
              {t('board_resignDesktop')}
            </button>
          )}
          {spectator && liveGame.status === 'InProgress' && (
            <button
              onClick={onBack}
              style={{
                background: 'transparent',
                color: 'var(--text-muted)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '10px 16px',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseOver={e => (e.currentTarget.style.background = 'var(--surface2)')}
              onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
            >
              {t('board_leaveDesktop')}
            </button>
          )}
        </div>
      </div>

      {winOverlay}
    </div>
  );
}

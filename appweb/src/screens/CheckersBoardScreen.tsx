'use client';

import { Button } from '../components/Button';
import { BOARD_SIZE, findAt, isDarkSquare } from '../game/checkers';
import { useGameBoard } from '../hooks/useGameBoard';
import type { LoginResponse } from '../types/auth';
import type { GameResponse } from '../types/game';

export interface CheckersBoardScreenProps {
  game: GameResponse;
  session: LoginResponse;
  onBack: () => void;
}

const colorLabel = (color: 'dark' | 'light') => (color === 'dark' ? 'Escuras' : 'Claras');

export function CheckersBoardScreen({ game, session, onBack }: CheckersBoardScreenProps) {
  const {
    game: liveGame,
    engine,
    myColor,
    myUsername,
    opponentUsername,
    isMyTurn,
    winner,
    watchersCount,
    sendingMove,
    error,
    boardSize,
    cellSize,
    animating,
    piecePositions,
    darkCount,
    lightCount,
    handleCellPress,
  } = useGameBoard(game, session);

  const {
    pieces,
    mustCapture,
    pendingCaptureId,
    activeId,
    selectedPiece,
    validMoveMap,
  } = engine;

  const pieceSize = Math.round(cellSize * 0.78);
  const pieceOffset = (cellSize - pieceSize) / 2;

  const myCount = myColor === 'dark' ? darkCount : lightCount;
  const oppCount = myColor === 'dark' ? lightCount : darkCount;

  const statusText = () => {
    if (winner) return winner === myColor ? 'Você venceu! 🏆' : 'Você perdeu.';
    if (sendingMove) return 'Enviando movimento...';
    if (pendingCaptureId) return 'Captura múltipla!';
    if (mustCapture) return 'Captura obrigatória';
    return isMyTurn ? 'Sua vez' : `Vez de ${opponentUsername ?? 'oponente'}`;
  };

  return (
    <div
      className="flex h-full flex-col items-center overflow-y-auto py-4"
      style={{ background: 'var(--bg)' }}
    >
      {/* Header */}
      <div className="mb-4 flex w-full max-w-lg flex-col items-center gap-1 px-4">
        <h2 className="text-xl font-bold text-white">Damas</h2>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{statusText()}</p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {watchersCount} assistindo
        </p>
      </div>

      {/* Player chips */}
      <div className="mb-4 flex w-full max-w-lg items-center justify-between px-4">
        {/* Light (white pieces) player */}
        <div
          className="flex items-center gap-2 rounded-xl px-3 py-2 transition-colors"
          style={{
            background: myColor === 'light' && isMyTurn && !winner ? 'var(--surface2)' : 'var(--surface)',
            border: myColor === 'light' && isMyTurn && !winner ? '1px solid var(--text)' : '1px solid var(--border)',
          }}
        >
          <div className="h-4 w-4 rounded-full bg-white" style={{ border: '2px solid #999' }} />
          <div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Claras</p>
            <p className="max-w-[80px] truncate text-sm font-medium text-white">
              {myColor === 'light' ? myUsername : opponentUsername}
            </p>
          </div>
          <span className="text-sm font-bold text-white">{lightCount}</span>
        </div>

        <span className="text-lg" style={{ color: 'var(--text-muted)' }}>×</span>

        {/* Dark (black pieces) player */}
        <div
          className="flex items-center gap-2 rounded-xl px-3 py-2 transition-colors"
          style={{
            background: myColor === 'dark' && isMyTurn && !winner ? 'var(--surface2)' : 'var(--surface)',
            border: myColor === 'dark' && isMyTurn && !winner ? '1px solid var(--text)' : '1px solid var(--border)',
          }}
        >
          <span className="text-sm font-bold text-white">{darkCount}</span>
          <div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Escuras</p>
            <p className="max-w-[80px] truncate text-sm font-medium text-white">
              {myColor === 'dark' ? myUsername : opponentUsername}
            </p>
          </div>
          <div className="h-4 w-4 rounded-full bg-black" style={{ border: '2px solid #555' }} />
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-xl px-4 py-2 text-sm text-red-400"
          style={{ background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)' }}>
          {error}
        </p>
      )}

      {/* Board */}
      <div
        className="relative rounded-2xl p-3"
        style={{ background: 'var(--surface)', border: '2px solid var(--border)' }}
      >
        <div
          className="relative"
          style={{ width: boardSize, height: boardSize }}
        >
          {/* Cell grid */}
          {Array.from({ length: BOARD_SIZE }, (_, row) =>
            Array.from({ length: BOARD_SIZE }, (_, col) => {
              const dark = isDarkSquare(row, col);
              const isTarget = validMoveMap.has(`${row}-${col}`);
              const hasPiece = !!findAt(pieces, row, col);
              const isSelectedCell =
                selectedPiece?.row === row && selectedPiece?.col === col;

              return (
                <div
                  key={`${row}-${col}`}
                  onClick={() => handleCellPress(row, col)}
                  className="absolute flex items-center justify-center cursor-pointer"
                  style={{
                    width: cellSize,
                    height: cellSize,
                    left: col * cellSize,
                    top: row * cellSize,
                    background: dark
                      ? isSelectedCell
                        ? '#4a3a2a'
                        : '#3d2b1f'
                      : '#f0d9b5',
                    outline: isSelectedCell ? '2px solid #f0a040' : 'none',
                  }}
                >
                  {/* Target indicator */}
                  {isTarget && !hasPiece && (
                    <div
                      className="rounded-full"
                      style={{
                        width: cellSize * 0.3,
                        height: cellSize * 0.3,
                        background: 'rgba(255,255,255,0.4)',
                      }}
                    />
                  )}
                  {/* Capture ring */}
                  {isTarget && hasPiece && (
                    <div
                      className="absolute rounded-full"
                      style={{
                        width: cellSize * 0.9,
                        height: cellSize * 0.9,
                        border: '3px solid rgba(255,100,100,0.8)',
                      }}
                    />
                  )}
                </div>
              );
            }),
          )}

          {/* Pieces layer — CSS transition for movement */}
          {pieces.map(piece => {
            const pos = piecePositions.get(piece.id);
            const displayRow = pos?.row ?? piece.row;
            const displayCol = pos?.col ?? piece.col;
            const opacity = pos?.opacity ?? 1;
            const isSelected = piece.id === activeId;

            return (
              <div
                key={piece.id}
                className="absolute pointer-events-none"
                style={{
                  width: cellSize,
                  height: cellSize,
                  left: displayCol * cellSize,
                  top: displayRow * cellSize,
                  opacity,
                  transition: animating ? 'left 0.22s ease, top 0.22s ease, opacity 0.2s ease' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: isSelected ? 10 : 1,
                }}
              >
                {isSelected && (
                  <div
                    className="absolute rounded-full"
                    style={{
                      width: pieceSize + 10,
                      height: pieceSize + 10,
                      border: '2px solid rgba(255,200,50,0.9)',
                      borderRadius: '50%',
                    }}
                  />
                )}
                <div
                  className="relative flex items-center justify-center rounded-full"
                  style={{
                    width: pieceSize,
                    height: pieceSize,
                    background: piece.color === 'dark'
                      ? 'radial-gradient(circle at 35% 35%, #555, #111)'
                      : 'radial-gradient(circle at 35% 35%, #fff, #ccc)',
                    boxShadow: piece.color === 'dark'
                      ? '0 2px 6px rgba(0,0,0,0.6), inset 0 1px 2px rgba(255,255,255,0.15)'
                      : '0 2px 6px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.8)',
                    border: isSelected
                      ? `2px solid ${piece.color === 'dark' ? '#888' : '#aaa'}`
                      : `2px solid ${piece.color === 'dark' ? '#333' : '#aaa'}`,
                  }}
                >
                  {piece.isKing && (
                    <span
                      className="select-none"
                      style={{
                        fontSize: pieceSize * 0.45,
                        color: piece.color === 'dark' ? '#ffd700' : '#8b4513',
                        lineHeight: 1,
                      }}
                    >
                      ♛
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex w-full max-w-lg flex-col items-center gap-3 px-4">
        {winner && (
          <p className="text-center text-base font-semibold text-white">
            {winner === myColor
              ? `Você venceu com as ${colorLabel(myColor)}!`
              : `${opponentUsername} venceu.`}
          </p>
        )}
        <Button label="Voltar" variant="ghost" onClick={onBack} fullWidth={false} />
      </div>
    </div>
  );
}

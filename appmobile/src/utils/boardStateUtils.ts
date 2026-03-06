import type {GameResponse, PieceColorApi} from '../types/game';
import type {Piece, PieceColor} from '../game/checkers';
import {GameEngine} from '../game/GameEngine';

interface ApiBoardState {
  cells: number[][];
  pendingCaptureRow: number;
  pendingCaptureCol: number;
}

export function parseApiColor(apiColor: PieceColorApi): PieceColor {
  return apiColor === 'Black' ? 'dark' : 'light';
}

export function getMyColor(game: GameResponse, playerId: string): PieceColor {
  return game.playerBlackId === playerId ? 'dark' : 'light';
}

export function boardStateToEngine(
  boardStateJson: string,
  currentTurn: PieceColorApi,
): GameEngine {
  const state: ApiBoardState = JSON.parse(boardStateJson);
  const pieces: Piece[] = [];

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const cell = state.cells[r]?.[c] ?? 0;
      if (cell === 0) {continue;}

      const color: PieceColor = cell === 1 || cell === 3 ? 'dark' : 'light';
      const isKing = cell === 3 || cell === 4;
      pieces.push({id: `${color[0]}-${r}-${c}`, color, row: r, col: c, isKing});
    }
  }

  let pendingCaptureId: string | null = null;
  if (state.pendingCaptureRow >= 0) {
    const pr = state.pendingCaptureRow;
    const pc = state.pendingCaptureCol;
    const piece = pieces.find(p => p.row === pr && p.col === pc);
    pendingCaptureId = piece?.id ?? null;
  }

  return GameEngine.fromPieces(pieces, parseApiColor(currentTurn), pendingCaptureId);
}

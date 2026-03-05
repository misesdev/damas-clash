// ────────────────────────────────────────────────────────────────────────────
// Brazilian Damas (Damas Brasileiras) — pure game logic
// Rules:
//  • 8×8 board, dark squares only, (row+col)%2===1
//  • Dark pieces start rows 0–2, Light pieces rows 5–7
//  • Men move forward only; capture in all 4 diagonals (mandatory)
//  • Kings (damas) move/capture long-range in all diagonals
//  • Capture is mandatory; multi-capture continues the same turn
//  • Promotion during a capture ends the capturing turn (no further captures)
//  • Win: opponent has no pieces OR has no legal moves
// ────────────────────────────────────────────────────────────────────────────

export const BOARD_SIZE = 8;

export type PieceColor = 'dark' | 'light';

export interface Piece {
  id: string;
  color: PieceColor;
  row: number;
  col: number;
  isKing: boolean;
}

export interface Move {
  row: number;
  col: number;
  /** ID of the piece captured by this move, if any */
  captureId?: string;
}

// ── Utilities ────────────────────────────────────────────────────────────────

export const isDarkSquare = (row: number, col: number): boolean =>
  (row + col) % 2 === 1;

export const isInside = (r: number, c: number): boolean =>
  r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE;

export const findAt = (pieces: Piece[], r: number, c: number): Piece | undefined =>
  pieces.find(p => p.row === r && p.col === c);

export const shouldPromote = (piece: Piece, toRow: number): boolean =>
  !piece.isKing &&
  (piece.color === 'dark' ? toRow === BOARD_SIZE - 1 : toRow === 0);

// ── Setup ─────────────────────────────────────────────────────────────────────

export const createInitialPieces = (): Piece[] => {
  const pieces: Piece[] = [];
  let id = 0;
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (!isDarkSquare(row, col)) {
        continue;
      }
      if (row < 3) {
        pieces.push({id: `d${id++}`, color: 'dark', row, col, isKing: false});
      } else if (row >= BOARD_SIZE - 3) {
        pieces.push({id: `l${id++}`, color: 'light', row, col, isKing: false});
      }
    }
  }
  return pieces;
};

// ── Capture moves ─────────────────────────────────────────────────────────────

const ALL_DIRS: [number, number][] = [[-1, -1], [-1, 1], [1, -1], [1, 1]];

export const getCaptureMoves = (piece: Piece, pieces: Piece[]): Move[] => {
  const captures: Move[] = [];

  if (piece.isKing) {
    // Long-range: slide until blocked; can jump one enemy per diagonal
    for (const [dr, dc] of ALL_DIRS) {
      let r = piece.row + dr;
      let c = piece.col + dc;
      let enemy: Piece | undefined;
      while (isInside(r, c)) {
        const at = findAt(pieces, r, c);
        if (at) {
          // Hit a piece
          if (at.color === piece.color || enemy) {
            break; // own piece, or second enemy in same line → stop
          }
          enemy = at;
        } else if (enemy) {
          // Empty square after an enemy → valid landing spot
          captures.push({row: r, col: c, captureId: enemy.id});
        }
        r += dr;
        c += dc;
      }
    }
  } else {
    // Man: can capture in all 4 diagonals (not just forward)
    for (const [dr, dc] of ALL_DIRS) {
      const er = piece.row + dr;
      const ec = piece.col + dc;
      if (!isInside(er, ec)) {
        continue;
      }
      const enemy = findAt(pieces, er, ec);
      if (!enemy || enemy.color === piece.color) {
        continue;
      }
      const lr = er + dr;
      const lc = ec + dc;
      if (isInside(lr, lc) && !findAt(pieces, lr, lc)) {
        captures.push({row: lr, col: lc, captureId: enemy.id});
      }
    }
  }

  return captures;
};

// ── Regular (non-capture) moves ───────────────────────────────────────────────

export const getRegularMoves = (piece: Piece, pieces: Piece[]): Move[] => {
  const moves: Move[] = [];

  if (piece.isKing) {
    for (const [dr, dc] of ALL_DIRS) {
      let r = piece.row + dr;
      let c = piece.col + dc;
      while (isInside(r, c) && !findAt(pieces, r, c)) {
        moves.push({row: r, col: c});
        r += dr;
        c += dc;
      }
    }
  } else {
    const dirs: [number, number][] =
      piece.color === 'dark' ? [[1, -1], [1, 1]] : [[-1, -1], [-1, 1]];
    for (const [dr, dc] of dirs) {
      const r = piece.row + dr;
      const c = piece.col + dc;
      if (isInside(r, c) && !findAt(pieces, r, c)) {
        moves.push({row: r, col: c});
      }
    }
  }

  return moves;
};

// ── Mandatory-capture check ───────────────────────────────────────────────────

/** True when at least one piece of `color` can capture an enemy this turn. */
export const hasMandatoryCapture = (color: PieceColor, pieces: Piece[]): boolean =>
  pieces.some(p => p.color === color && getCaptureMoves(p, pieces).length > 0);

// ── Valid moves for a single piece ────────────────────────────────────────────

/**
 * Returns the legal moves for `piece`.
 * Pass `mustCapture = true` when any piece of the same colour can capture —
 * in that case only capture moves are returned for this piece.
 */
export const getValidMoves = (
  piece: Piece,
  pieces: Piece[],
  mustCapture: boolean,
): Move[] => {
  const captures = getCaptureMoves(piece, pieces);
  if (captures.length > 0) {
    return captures;
  }
  if (mustCapture) {
    return []; // another piece of the same colour must capture
  }
  return getRegularMoves(piece, pieces);
};

// ── Win condition ─────────────────────────────────────────────────────────────

/** Returns the winner colour, or null if the game is still ongoing. */
export const getWinner = (pieces: Piece[], currentTurn: PieceColor): PieceColor | null => {
  const darkCount = pieces.filter(p => p.color === 'dark').length;
  const lightCount = pieces.filter(p => p.color === 'light').length;
  if (darkCount === 0) {
    return 'light';
  }
  if (lightCount === 0) {
    return 'dark';
  }
  // Current player has no legal moves → they lose
  const mustCapture = hasMandatoryCapture(currentTurn, pieces);
  const hasAnyMove = pieces
    .filter(p => p.color === currentTurn)
    .some(p => getValidMoves(p, pieces, mustCapture).length > 0);
  if (!hasAnyMove) {
    return currentTurn === 'dark' ? 'light' : 'dark';
  }
  return null;
};

// ── Apply a move (returns new piece array) ────────────────────────────────────

export interface ApplyMoveResult {
  pieces: Piece[];
  movedPiece: Piece;
  justPromoted: boolean;
}

export const applyMove = (
  pieces: Piece[],
  movingId: string,
  move: Move,
): ApplyMoveResult => {
  const original = pieces.find(p => p.id === movingId)!;
  const promoted = shouldPromote(original, move.row);
  const movedPiece: Piece = {
    ...original,
    row: move.row,
    col: move.col,
    isKing: original.isKing || promoted,
  };
  const next = pieces
    .map(p => (p.id === movingId ? movedPiece : p))
    .filter(p => p.id !== move.captureId);
  return {pieces: next, movedPiece, justPromoted: promoted};
};

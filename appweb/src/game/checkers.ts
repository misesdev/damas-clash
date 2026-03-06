// Brazilian Damas (Damas Brasileiras) — pure game logic
// Same rules as mobile app

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
  captureId?: string;
}

export const isDarkSquare = (row: number, col: number): boolean =>
  (row + col) % 2 === 1;

export const isInside = (r: number, c: number): boolean =>
  r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE;

export const findAt = (pieces: Piece[], r: number, c: number): Piece | undefined =>
  pieces.find(p => p.row === r && p.col === c);

export const shouldPromote = (piece: Piece, toRow: number): boolean =>
  !piece.isKing &&
  (piece.color === 'dark' ? toRow === BOARD_SIZE - 1 : toRow === 0);

export const createInitialPieces = (): Piece[] => {
  const pieces: Piece[] = [];
  let id = 0;
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (!isDarkSquare(row, col)) continue;
      if (row < 3) {
        pieces.push({ id: `d${id++}`, color: 'dark', row, col, isKing: false });
      } else if (row >= BOARD_SIZE - 3) {
        pieces.push({ id: `l${id++}`, color: 'light', row, col, isKing: false });
      }
    }
  }
  return pieces;
};

const ALL_DIRS: [number, number][] = [[-1, -1], [-1, 1], [1, -1], [1, 1]];

export const getCaptureMoves = (piece: Piece, pieces: Piece[]): Move[] => {
  const captures: Move[] = [];

  if (piece.isKing) {
    for (const [dr, dc] of ALL_DIRS) {
      let r = piece.row + dr;
      let c = piece.col + dc;
      let enemy: Piece | undefined;
      while (isInside(r, c)) {
        const at = findAt(pieces, r, c);
        if (at) {
          if (at.color === piece.color || enemy) break;
          enemy = at;
        } else if (enemy) {
          captures.push({ row: r, col: c, captureId: enemy.id });
        }
        r += dr;
        c += dc;
      }
    }
  } else {
    for (const [dr, dc] of ALL_DIRS) {
      const er = piece.row + dr;
      const ec = piece.col + dc;
      if (!isInside(er, ec)) continue;
      const enemy = findAt(pieces, er, ec);
      if (!enemy || enemy.color === piece.color) continue;
      const lr = er + dr;
      const lc = ec + dc;
      if (isInside(lr, lc) && !findAt(pieces, lr, lc)) {
        captures.push({ row: lr, col: lc, captureId: enemy.id });
      }
    }
  }

  return captures;
};

export const getRegularMoves = (piece: Piece, pieces: Piece[]): Move[] => {
  const moves: Move[] = [];

  if (piece.isKing) {
    for (const [dr, dc] of ALL_DIRS) {
      let r = piece.row + dr;
      let c = piece.col + dc;
      while (isInside(r, c) && !findAt(pieces, r, c)) {
        moves.push({ row: r, col: c });
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
        moves.push({ row: r, col: c });
      }
    }
  }

  return moves;
};

export const hasMandatoryCapture = (color: PieceColor, pieces: Piece[]): boolean =>
  pieces.some(p => p.color === color && getCaptureMoves(p, pieces).length > 0);

export const getValidMoves = (
  piece: Piece,
  pieces: Piece[],
  mustCapture: boolean,
): Move[] => {
  const captures = getCaptureMoves(piece, pieces);
  if (captures.length > 0) return captures;
  if (mustCapture) return [];
  return getRegularMoves(piece, pieces);
};

export const getWinner = (pieces: Piece[], currentTurn: PieceColor): PieceColor | null => {
  const darkCount = pieces.filter(p => p.color === 'dark').length;
  const lightCount = pieces.filter(p => p.color === 'light').length;
  if (darkCount === 0) return 'light';
  if (lightCount === 0) return 'dark';
  const mustCapture = hasMandatoryCapture(currentTurn, pieces);
  const hasAnyMove = pieces
    .filter(p => p.color === currentTurn)
    .some(p => getValidMoves(p, pieces, mustCapture).length > 0);
  if (!hasAnyMove) return currentTurn === 'dark' ? 'light' : 'dark';
  return null;
};

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
  return { pieces: next, movedPiece, justPromoted: promoted };
};

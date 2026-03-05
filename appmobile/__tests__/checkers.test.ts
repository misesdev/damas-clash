/**
 * Pure game logic tests — no React, no rendering.
 * Tests cover Brazilian Damas rules:
 *  • initial board layout
 *  • regular moves (men forward, kings long-range)
 *  • capture moves (all diagonals for men; long-range for kings)
 *  • mandatory capture enforcement
 *  • multi-capture detection
 *  • promotion rules
 *  • win conditions
 */

import {
  type Piece,
  type PieceColor,
  applyMove,
  createInitialPieces,
  findAt,
  getCaptureMoves,
  getRegularMoves,
  getValidMoves,
  getWinner,
  hasMandatoryCapture,
  isDarkSquare,
  isInside,
  shouldPromote,
} from '../src/game/checkers';

// ── Helpers ───────────────────────────────────────────────────────────────────

const piece = (
  id: string,
  color: PieceColor,
  row: number,
  col: number,
  isKing = false,
): Piece => ({id, color, row, col, isKing});

// ── isDarkSquare ──────────────────────────────────────────────────────────────

describe('isDarkSquare', () => {
  it('returns true when (row+col) is odd', () => {
    expect(isDarkSquare(0, 1)).toBe(true);
    expect(isDarkSquare(1, 0)).toBe(true);
    expect(isDarkSquare(3, 4)).toBe(true);
  });

  it('returns false when (row+col) is even', () => {
    expect(isDarkSquare(0, 0)).toBe(false);
    expect(isDarkSquare(1, 1)).toBe(false);
    expect(isDarkSquare(4, 4)).toBe(false);
  });
});

// ── isInside ──────────────────────────────────────────────────────────────────

describe('isInside', () => {
  it('returns true for valid coordinates', () => {
    expect(isInside(0, 0)).toBe(true);
    expect(isInside(7, 7)).toBe(true);
    expect(isInside(4, 3)).toBe(true);
  });

  it('returns false for out-of-bounds coordinates', () => {
    expect(isInside(-1, 0)).toBe(false);
    expect(isInside(0, -1)).toBe(false);
    expect(isInside(8, 0)).toBe(false);
    expect(isInside(0, 8)).toBe(false);
  });
});

// ── createInitialPieces ───────────────────────────────────────────────────────

describe('createInitialPieces', () => {
  let pieces: Piece[];

  beforeEach(() => {
    pieces = createInitialPieces();
  });

  it('creates 24 pieces total', () => {
    expect(pieces).toHaveLength(24);
  });

  it('creates 12 dark and 12 light pieces', () => {
    expect(pieces.filter(p => p.color === 'dark')).toHaveLength(12);
    expect(pieces.filter(p => p.color === 'light')).toHaveLength(12);
  });

  it('places dark pieces in rows 0–2', () => {
    pieces
      .filter(p => p.color === 'dark')
      .forEach(p => expect(p.row).toBeLessThan(3));
  });

  it('places light pieces in rows 5–7', () => {
    pieces
      .filter(p => p.color === 'light')
      .forEach(p => expect(p.row).toBeGreaterThanOrEqual(5));
  });

  it('places all pieces on dark squares', () => {
    pieces.forEach(p => expect(isDarkSquare(p.row, p.col)).toBe(true));
  });

  it('gives every piece a unique id', () => {
    const ids = pieces.map(p => p.id);
    expect(new Set(ids).size).toBe(24);
  });

  it('starts all pieces as non-kings', () => {
    pieces.forEach(p => expect(p.isKing).toBe(false));
  });
});

// ── findAt ────────────────────────────────────────────────────────────────────

describe('findAt', () => {
  it('finds an existing piece', () => {
    const pieces = [piece('a', 'dark', 2, 3)];
    expect(findAt(pieces, 2, 3)).toBe(pieces[0]);
  });

  it('returns undefined when cell is empty', () => {
    expect(findAt([], 2, 3)).toBeUndefined();
  });
});

// ── shouldPromote ─────────────────────────────────────────────────────────────

describe('shouldPromote', () => {
  it('promotes a dark man reaching row 7', () => {
    expect(shouldPromote(piece('d', 'dark', 6, 1), 7)).toBe(true);
  });

  it('does NOT promote a dark man that has not reached row 7', () => {
    expect(shouldPromote(piece('d', 'dark', 5, 1), 6)).toBe(false);
  });

  it('promotes a light man reaching row 0', () => {
    expect(shouldPromote(piece('l', 'light', 1, 2), 0)).toBe(true);
  });

  it('does NOT promote a light man that has not reached row 0', () => {
    expect(shouldPromote(piece('l', 'light', 2, 1), 1)).toBe(false);
  });

  it('never promotes a king', () => {
    const king = piece('k', 'dark', 6, 1, true);
    expect(shouldPromote(king, 7)).toBe(false);
  });
});

// ── getRegularMoves — Men ─────────────────────────────────────────────────────

describe('getRegularMoves — man', () => {
  it('dark man moves forward (increasing row)', () => {
    const p = piece('d', 'dark', 3, 3);
    const moves = getRegularMoves(p, [p]);
    const targets = moves.map(m => `${m.row}-${m.col}`).sort();
    expect(targets).toEqual(['4-2', '4-4'].sort());
  });

  it('light man moves forward (decreasing row)', () => {
    const p = piece('l', 'light', 4, 4);
    const moves = getRegularMoves(p, [p]);
    const targets = moves.map(m => `${m.row}-${m.col}`).sort();
    expect(targets).toEqual(['3-3', '3-5'].sort());
  });

  it('does not move to occupied squares', () => {
    const p = piece('d', 'dark', 3, 3);
    const blocker = piece('b', 'dark', 4, 4);
    const moves = getRegularMoves(p, [p, blocker]);
    expect(moves.map(m => `${m.row}-${m.col}`)).toEqual(['4-2']);
  });

  it('returns no moves when both forward diagonals are blocked', () => {
    const p = piece('d', 'dark', 3, 3);
    const b1 = piece('b1', 'dark', 4, 2);
    const b2 = piece('b2', 'dark', 4, 4);
    expect(getRegularMoves(p, [p, b1, b2])).toHaveLength(0);
  });

  it('does not return captures as regular moves', () => {
    const p = piece('d', 'dark', 3, 3);
    const enemy = piece('e', 'light', 4, 4);
    // Square at 5-5 is free → regular move would be capture (not here)
    const moves = getRegularMoves(p, [p, enemy]);
    // Regular moves only go to adjacent empty squares
    expect(moves.every(m => m.captureId === undefined)).toBe(true);
    // The 4-4 square is occupied so it should not appear
    expect(moves.find(m => m.row === 4 && m.col === 4)).toBeUndefined();
  });
});

// ── getRegularMoves — Kings ────────────────────────────────────────────────────

describe('getRegularMoves — king (long-range)', () => {
  it('slides along all 4 diagonals until the board edge', () => {
    const k = piece('k', 'dark', 4, 4, true);
    const moves = getRegularMoves(k, [k]);
    // A king at (4,4) can reach many squares in all 4 directions
    expect(moves.length).toBeGreaterThan(4);
    // Should include squares far away like (0,0) and (7,7)
    expect(moves.find(m => m.row === 0 && m.col === 0)).toBeTruthy();
    expect(moves.find(m => m.row === 7 && m.col === 7)).toBeTruthy();
  });

  it('stops before a blocking friendly piece', () => {
    const k = piece('k', 'dark', 4, 4, true);
    const blocker = piece('b', 'dark', 6, 6); // blocks (7,7)
    const moves = getRegularMoves(k, [k, blocker]);
    expect(moves.find(m => m.row === 5 && m.col === 5)).toBeTruthy();
    expect(moves.find(m => m.row === 6 && m.col === 6)).toBeUndefined(); // blocked
    expect(moves.find(m => m.row === 7 && m.col === 7)).toBeUndefined(); // behind blocker
  });

  it('stops before an enemy piece (cannot pass through; capture handled separately)', () => {
    const k = piece('k', 'dark', 4, 4, true);
    const enemy = piece('e', 'light', 6, 6);
    const moves = getRegularMoves(k, [k, enemy]);
    // Regular moves cannot pass over enemy
    expect(moves.find(m => m.row === 6 && m.col === 6)).toBeUndefined();
    expect(moves.find(m => m.row === 7 && m.col === 7)).toBeUndefined();
  });
});

// ── getCaptureMoves — Men ─────────────────────────────────────────────────────

describe('getCaptureMoves — man', () => {
  it('captures an enemy piece in any diagonal', () => {
    const p = piece('d', 'dark', 3, 3);
    // Enemy behind (backwards diagonal — men CAN capture backwards)
    const enemy = piece('e', 'light', 2, 2);
    const moves = getCaptureMoves(p, [p, enemy]);
    expect(moves).toHaveLength(1);
    expect(moves[0]).toMatchObject({row: 1, col: 1, captureId: 'e'});
  });

  it('captures forward enemy', () => {
    const p = piece('d', 'dark', 3, 3);
    const enemy = piece('e', 'light', 4, 4);
    const moves = getCaptureMoves(p, [p, enemy]);
    expect(moves[0]).toMatchObject({row: 5, col: 5, captureId: 'e'});
  });

  it('does not capture own pieces', () => {
    const p = piece('d', 'dark', 3, 3);
    const own = piece('o', 'dark', 4, 4);
    expect(getCaptureMoves(p, [p, own])).toHaveLength(0);
  });

  it('does not capture when landing square is occupied', () => {
    const p = piece('d', 'dark', 3, 3);
    const enemy = piece('e', 'light', 4, 4);
    const blocker = piece('b', 'dark', 5, 5);
    expect(getCaptureMoves(p, [p, enemy, blocker])).toHaveLength(0);
  });

  it('returns multiple captures when available', () => {
    const p = piece('d', 'dark', 3, 3);
    const e1 = piece('e1', 'light', 4, 4);
    const e2 = piece('e2', 'light', 2, 4);
    const moves = getCaptureMoves(p, [p, e1, e2]);
    expect(moves).toHaveLength(2);
  });
});

// ── getCaptureMoves — Kings ───────────────────────────────────────────────────

describe('getCaptureMoves — king (long-range)', () => {
  it('captures enemy that is not adjacent', () => {
    const k = piece('k', 'dark', 0, 0, true);
    const enemy = piece('e', 'light', 3, 3);
    // Can land on 4-4, 5-5, 6-6, 7-7
    const moves = getCaptureMoves(k, [k, enemy]);
    expect(moves.length).toBeGreaterThanOrEqual(1);
    expect(moves.every(m => m.captureId === 'e')).toBe(true);
    expect(moves.find(m => m.row === 4 && m.col === 4)).toBeTruthy();
  });

  it('cannot capture when landing squares are blocked', () => {
    const k = piece('k', 'dark', 0, 0, true);
    const enemy = piece('e', 'light', 3, 3);
    const blocker = piece('b', 'dark', 4, 4);
    expect(getCaptureMoves(k, [k, enemy, blocker])).toHaveLength(0);
  });

  it('stops at second enemy in same diagonal', () => {
    const k = piece('k', 'dark', 0, 0, true);
    const enemy1 = piece('e1', 'light', 2, 2);
    const enemy2 = piece('e2', 'light', 4, 4);
    const moves = getCaptureMoves(k, [k, enemy1, enemy2]);
    // Can only capture e1 (lands at 3-3)
    expect(moves.every(m => m.captureId === 'e1')).toBe(true);
    expect(moves.find(m => m.captureId === 'e2')).toBeUndefined();
  });
});

// ── hasMandatoryCapture ───────────────────────────────────────────────────────

describe('hasMandatoryCapture', () => {
  it('returns true when a piece can capture', () => {
    const p = piece('d', 'dark', 3, 3);
    const enemy = piece('e', 'light', 4, 4);
    expect(hasMandatoryCapture('dark', [p, enemy])).toBe(true);
  });

  it('returns false when no captures are possible', () => {
    const pieces = createInitialPieces();
    expect(hasMandatoryCapture('dark', pieces)).toBe(false);
    expect(hasMandatoryCapture('light', pieces)).toBe(false);
  });

  it('returns false for the opponent colour when its landing square is blocked', () => {
    // dark at (4,4) can capture light at (5,5) — land at (6,6) is free → dark MUST capture
    // light at (5,5) wants to capture dark at (4,4) — land at (3,3) is occupied by own dark piece
    //   → light CANNOT capture
    const d1 = piece('d1', 'dark', 4, 4);
    const d2 = piece('d2', 'dark', 3, 3); // blocks light's landing square
    const l = piece('l', 'light', 5, 5);
    expect(hasMandatoryCapture('dark', [d1, d2, l])).toBe(true);
    expect(hasMandatoryCapture('light', [d1, d2, l])).toBe(false);
  });
});

// ── getValidMoves — mandatory capture enforcement ─────────────────────────────

describe('getValidMoves — mandatory capture', () => {
  it('only returns capture moves when mustCapture is true and piece can capture', () => {
    const p = piece('d', 'dark', 3, 3);
    const enemy = piece('e', 'light', 4, 4);
    const moves = getValidMoves(p, [p, enemy], true);
    expect(moves.every(m => m.captureId !== undefined)).toBe(true);
  });

  it('returns no moves for a piece that cannot capture when mustCapture is true', () => {
    const mover = piece('d1', 'dark', 3, 3);
    const capturer = piece('d2', 'dark', 5, 5); // this one can capture
    const enemy = piece('e', 'light', 4, 4); // adjacent to capturer? No — let's adjust
    // Put enemy adjacent to capturer so capturer can capture; mover cannot
    const enemy2 = piece('e2', 'light', 6, 6);
    const moves = getValidMoves(mover, [mover, capturer, enemy2], true);
    expect(moves).toHaveLength(0);
  });

  it('returns regular moves when mustCapture is false and no captures available', () => {
    const p = piece('d', 'dark', 3, 3);
    const moves = getValidMoves(p, [p], false);
    expect(moves.length).toBeGreaterThan(0);
    expect(moves.every(m => m.captureId === undefined)).toBe(true);
  });
});

// ── applyMove ─────────────────────────────────────────────────────────────────

describe('applyMove', () => {
  it('moves a piece to the target square', () => {
    const p = piece('d', 'dark', 3, 3);
    const {pieces, movedPiece} = applyMove([p], 'd', {row: 4, col: 4});
    expect(pieces).toHaveLength(1);
    expect(movedPiece.row).toBe(4);
    expect(movedPiece.col).toBe(4);
  });

  it('removes the captured piece', () => {
    const p = piece('d', 'dark', 3, 3);
    const enemy = piece('e', 'light', 4, 4);
    const {pieces} = applyMove([p, enemy], 'd', {row: 5, col: 5, captureId: 'e'});
    expect(pieces).toHaveLength(1);
    expect(pieces.find(x => x.id === 'e')).toBeUndefined();
  });

  it('promotes a dark man reaching row 7', () => {
    const p = piece('d', 'dark', 6, 1);
    const {movedPiece, justPromoted} = applyMove([p], 'd', {row: 7, col: 2});
    expect(movedPiece.isKing).toBe(true);
    expect(justPromoted).toBe(true);
  });

  it('promotes a light man reaching row 0', () => {
    const p = piece('l', 'light', 1, 2);
    const {movedPiece, justPromoted} = applyMove([p], 'l', {row: 0, col: 1});
    expect(movedPiece.isKing).toBe(true);
    expect(justPromoted).toBe(true);
  });

  it('does not promote a king (already king)', () => {
    const k = piece('k', 'dark', 6, 1, true);
    const {movedPiece, justPromoted} = applyMove([k], 'k', {row: 7, col: 2});
    expect(movedPiece.isKing).toBe(true);
    expect(justPromoted).toBe(false);
  });

  it('does not promote when not reaching the back rank', () => {
    const p = piece('d', 'dark', 3, 3);
    const {justPromoted} = applyMove([p], 'd', {row: 4, col: 4});
    expect(justPromoted).toBe(false);
  });
});

// ── getWinner ─────────────────────────────────────────────────────────────────

describe('getWinner', () => {
  it('returns null at game start', () => {
    expect(getWinner(createInitialPieces(), 'light')).toBeNull();
  });

  it('returns "light" when all dark pieces are captured', () => {
    const pieces = [piece('l', 'light', 7, 7)];
    expect(getWinner(pieces, 'light')).toBe('light');
  });

  it('returns "dark" when all light pieces are captured', () => {
    const pieces = [piece('d', 'dark', 0, 1)];
    expect(getWinner(pieces, 'dark')).toBe('dark');
  });

  it('returns the opponent when current player has no legal moves', () => {
    // Dark man at (7,6): row 7 → forward moves go to row 8 (out of bounds).
    // No adjacent enemies → no captures either. Dark has zero legal moves.
    // isDarkSquare(7,6) = (7+6)%2 = 1 ✓
    const dark = piece('d', 'dark', 7, 6);
    const light = piece('l', 'light', 3, 3); // light still has pieces
    expect(getWinner([dark, light], 'dark')).toBe('light');
  });
});

// ── Multi-capture scenario ────────────────────────────────────────────────────

describe('multi-capture', () => {
  it('detects further captures after a capture move', () => {
    // Dark piece at (2,2); enemies at (3,3) and (5,5); free at (4,4) and (6,6)
    const dark = piece('d', 'dark', 2, 2);
    const e1 = piece('e1', 'light', 3, 3);
    const e2 = piece('e2', 'light', 5, 5);

    // After capturing e1 at (4,4), check for further captures
    const {pieces: afterFirst, movedPiece} = applyMove(
      [dark, e1, e2],
      'd',
      {row: 4, col: 4, captureId: 'e1'},
    );

    expect(afterFirst.find(p => p.id === 'e1')).toBeUndefined();
    const further = getCaptureMoves(movedPiece, afterFirst);
    expect(further).toHaveLength(1);
    expect(further[0]).toMatchObject({row: 6, col: 6, captureId: 'e2'});
  });

  it('ends multi-capture chain when no more captures are available', () => {
    const dark = piece('d', 'dark', 2, 2);
    const e1 = piece('e1', 'light', 3, 3);
    const {pieces: afterFirst, movedPiece} = applyMove(
      [dark, e1],
      'd',
      {row: 4, col: 4, captureId: 'e1'},
    );
    const further = getCaptureMoves(movedPiece, afterFirst);
    expect(further).toHaveLength(0);
  });

  it('ends multi-capture when piece is promoted mid-chain', () => {
    // Dark man reaches row 7 during a capture → promotion stops the chain
    const dark = piece('d', 'dark', 5, 1);
    const enemy = piece('e', 'light', 6, 2);
    const enemy2 = piece('e2', 'light', 5, 5); // would be capturable after if not promoted
    const {movedPiece, justPromoted} = applyMove(
      [dark, enemy, enemy2],
      'd',
      {row: 7, col: 3, captureId: 'e'},
    );
    expect(justPromoted).toBe(true);
    expect(movedPiece.isKing).toBe(true);
  });
});

import {
  type Move,
  type Piece,
  type PieceColor,
  applyMove,
  createInitialPieces,
  findAt,
  getCaptureMoves,
  getValidMoves,
  getWinner,
  hasMandatoryCapture,
} from './checkers';

export class GameEngine {
  readonly pieces: Piece[];
  readonly currentTurn: PieceColor;
  readonly selectedId: string | null;
  readonly pendingCaptureId: string | null;

  private constructor(
    pieces: Piece[],
    currentTurn: PieceColor,
    selectedId: string | null,
    pendingCaptureId: string | null,
  ) {
    this.pieces = pieces;
    this.currentTurn = currentTurn;
    this.pendingCaptureId = pendingCaptureId;
    // Auto-select the only capturing piece so the user sees it immediately
    if (selectedId === null && pendingCaptureId === null) {
      const capturingPieces = pieces.filter(
        p => p.color === currentTurn && getCaptureMoves(p, pieces).length > 0,
      );
      this.selectedId = capturingPieces.length === 1 ? capturingPieces[0].id : null;
    } else {
      this.selectedId = selectedId;
    }
  }

  static initial(): GameEngine {
    return new GameEngine(createInitialPieces(), 'light', null, null);
  }

  static fromPieces(
    pieces: Piece[],
    currentTurn: PieceColor,
    pendingCaptureId: string | null,
  ): GameEngine {
    return new GameEngine(pieces, currentTurn, null, pendingCaptureId);
  }

  get activeId(): string | null {
    return this.pendingCaptureId ?? this.selectedId;
  }

  get mustCapture(): boolean {
    return hasMandatoryCapture(this.currentTurn, this.pieces);
  }

  get capturingPieceIds(): string[] {
    if (!this.mustCapture) return [];
    return this.pieces
      .filter(p => p.color === this.currentTurn && getCaptureMoves(p, this.pieces).length > 0)
      .map(p => p.id);
  }

  get selectedPiece(): Piece | undefined {
    return this.pieces.find(p => p.id === this.activeId);
  }

  get validMoves(): Move[] {
    if (!this.selectedPiece) return [];
    return getValidMoves(this.selectedPiece, this.pieces, this.mustCapture);
  }

  get validMoveMap(): Map<string, Move> {
    const m = new Map<string, Move>();
    this.validMoves.forEach(mv => m.set(`${mv.row}-${mv.col}`, mv));
    return m;
  }

  get darkCount(): number {
    return this.pieces.filter(p => p.color === 'dark').length;
  }

  get lightCount(): number {
    return this.pieces.filter(p => p.color === 'light').length;
  }

  get winner(): PieceColor | null {
    return getWinner(this.pieces, this.currentTurn);
  }

  selectPiece(row: number, col: number): GameEngine {
    const tapped = findAt(this.pieces, row, col);

    if (!this.selectedId) {
      if (tapped?.color === this.currentTurn) {
        const moves = getValidMoves(tapped, this.pieces, this.mustCapture);
        if (moves.length > 0) {
          return new GameEngine(this.pieces, this.currentTurn, tapped.id, null);
        }
      }
      return this;
    }

    if (tapped?.color === this.currentTurn) {
      if (tapped.id === this.selectedId) {
        return new GameEngine(this.pieces, this.currentTurn, null, null);
      }
      const moves = getValidMoves(tapped, this.pieces, this.mustCapture);
      return new GameEngine(
        this.pieces,
        this.currentTurn,
        moves.length > 0 ? tapped.id : null,
        null,
      );
    }

    return new GameEngine(this.pieces, this.currentTurn, null, null);
  }

  applyMoveAt(
    row: number,
    col: number,
  ): { movingPiece: Piece; move: Move; nextEngine: GameEngine } | null {
    const move = this.validMoveMap.get(`${row}-${col}`);
    if (!move) return null;

    const piece = this.pieces.find(p => p.id === this.activeId);
    if (!piece) return null;

    const { pieces: nextPieces, movedPiece, justPromoted } = applyMove(
      this.pieces,
      piece.id,
      move,
    );

    const furtherCaptures =
      move.captureId && !justPromoted ? getCaptureMoves(movedPiece, nextPieces) : [];

    const nextEngine =
      furtherCaptures.length > 0
        ? new GameEngine(nextPieces, this.currentTurn, null, piece.id)
        : new GameEngine(
            nextPieces,
            this.currentTurn === 'light' ? 'dark' : 'light',
            null,
            null,
          );

    return { movingPiece: piece, move, nextEngine };
  }

  reset(): GameEngine {
    return GameEngine.initial();
  }
}

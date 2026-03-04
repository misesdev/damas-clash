using api.Models.Enums;

namespace api.Engine;

/// <summary>
/// Pure static engine implementing Brazilian Draughts rules on an 8x8 board.
///
/// Rules:
///   - Pieces occupy dark squares where (row + col) % 2 == 1
///   - Black starts at rows 0-2, White at rows 5-7
///   - Men move diagonally forward one square
///   - Men capture diagonally in any direction (including backward)
///   - Kings (long-range) move/capture any number of squares diagonally
///   - Capture is mandatory; if multiple pieces can capture, player chooses which
///   - Multi-capture: after landing, if more captures available, turn continues
///   - Promotion during multi-capture ends the turn (piece stops as king)
///   - Win: opponent has no pieces OR opponent has no valid moves
/// </summary>
public static class BoardEngine
{
    public const int Empty = 0;
    public const int BlackMan = 1;
    public const int WhiteMan = 2;
    public const int BlackKing = 3;
    public const int WhiteKing = 4;

    private static readonly int[] DRow = [-1, -1, 1, 1];
    private static readonly int[] DCol = [-1, 1, -1, 1];

    // ── Board Creation ────────────────────────────────────────────────────────

    public static BoardStateData CreateInitialState()
    {
        var board = new int[8][];
        for (int r = 0; r < 8; r++)
        {
            board[r] = new int[8];
            for (int c = 0; c < 8; c++)
            {
                if ((r + c) % 2 != 1) continue;
                board[r][c] = r < 3 ? BlackMan : r > 4 ? WhiteMan : Empty;
            }
        }
        return new BoardStateData { Cells = board };
    }

    // ── Cell Queries ──────────────────────────────────────────────────────────

    public static bool IsBlack(int cell) => cell is BlackMan or BlackKing;
    public static bool IsWhite(int cell) => cell is WhiteMan or WhiteKing;
    public static bool IsKing(int cell) => cell is BlackKing or WhiteKing;
    public static bool IsOwned(int cell, PieceColor color) =>
        color == PieceColor.Black ? IsBlack(cell) : IsWhite(cell);
    public static bool IsOpponent(int cell, PieceColor color) =>
        color == PieceColor.Black ? IsWhite(cell) : IsBlack(cell);

    private static bool InBounds(int r, int c) => r is >= 0 and < 8 && c is >= 0 and < 8;

    // ── Move Generation ───────────────────────────────────────────────────────

    /// <summary>Returns all valid capture destinations for the piece at (row, col).</summary>
    public static List<CaptureMove> GetCaptures(int[][] board, int row, int col)
    {
        var cell = board[row][col];
        if (cell == Empty) return [];

        var color = IsBlack(cell) ? PieceColor.Black : PieceColor.White;
        var result = new List<CaptureMove>();

        if (IsKing(cell))
            CollectKingCaptures(board, row, col, color, result);
        else
            CollectManCaptures(board, row, col, color, result);

        return result;
    }

    private static void CollectManCaptures(int[][] board, int row, int col, PieceColor color, List<CaptureMove> result)
    {
        for (int d = 0; d < 4; d++)
        {
            int mr = row + DRow[d], mc = col + DCol[d]; // opponent square
            int lr = row + 2 * DRow[d], lc = col + 2 * DCol[d]; // landing square

            if (!InBounds(mr, mc) || !InBounds(lr, lc)) continue;
            if (!IsOpponent(board[mr][mc], color)) continue;
            if (board[lr][lc] != Empty) continue;

            result.Add(new CaptureMove(lr, lc, mr, mc));
        }
    }

    private static void CollectKingCaptures(int[][] board, int row, int col, PieceColor color, List<CaptureMove> result)
    {
        for (int d = 0; d < 4; d++)
        {
            int r = row + DRow[d], c = col + DCol[d];
            bool foundOpponent = false;
            int oppRow = -1, oppCol = -1;

            while (InBounds(r, c))
            {
                var sq = board[r][c];

                if (!foundOpponent)
                {
                    if (sq == Empty) { r += DRow[d]; c += DCol[d]; continue; }
                    if (IsOpponent(sq, color)) { foundOpponent = true; oppRow = r; oppCol = c; }
                    else break; // friendly piece blocks
                }
                else
                {
                    if (sq == Empty) result.Add(new CaptureMove(r, c, oppRow, oppCol));
                    else break; // any piece after the opponent blocks further landing squares
                }

                r += DRow[d];
                c += DCol[d];
            }
        }
    }

    /// <summary>Returns all valid simple (non-capture) move destinations for the piece at (row, col).</summary>
    public static List<(int ToRow, int ToCol)> GetSimpleMoves(int[][] board, int row, int col)
    {
        var cell = board[row][col];
        if (cell == Empty) return [];

        var color = IsBlack(cell) ? PieceColor.Black : PieceColor.White;
        var result = new List<(int, int)>();

        if (IsKing(cell))
        {
            for (int d = 0; d < 4; d++)
            {
                int r = row + DRow[d], c = col + DCol[d];
                while (InBounds(r, c) && board[r][c] == Empty)
                {
                    result.Add((r, c));
                    r += DRow[d];
                    c += DCol[d];
                }
            }
        }
        else
        {
            int fwd = color == PieceColor.Black ? 1 : -1;
            for (int dc = -1; dc <= 1; dc += 2)
            {
                int nr = row + fwd, nc = col + dc;
                if (InBounds(nr, nc) && board[nr][nc] == Empty)
                    result.Add((nr, nc));
            }
        }

        return result;
    }

    /// <summary>Returns true if any piece of the given color can make a capture.</summary>
    public static bool HasAnyCapture(int[][] board, PieceColor color)
    {
        for (int r = 0; r < 8; r++)
            for (int c = 0; c < 8; c++)
                if (IsOwned(board[r][c], color) && GetCaptures(board, r, c).Count > 0)
                    return true;
        return false;
    }

    /// <summary>Returns true if the given color has at least one valid move (simple or capture).</summary>
    public static bool HasAnyValidMove(int[][] board, PieceColor color)
    {
        for (int r = 0; r < 8; r++)
            for (int c = 0; c < 8; c++)
            {
                if (!IsOwned(board[r][c], color)) continue;
                if (GetCaptures(board, r, c).Count > 0) return true;
                if (GetSimpleMoves(board, r, c).Count > 0) return true;
            }
        return false;
    }

    /// <summary>Returns true if the given color has at least one piece on the board.</summary>
    public static bool HasPieces(int[][] board, PieceColor color)
    {
        for (int r = 0; r < 8; r++)
            for (int c = 0; c < 8; c++)
                if (IsOwned(board[r][c], color)) return true;
        return false;
    }

    // ── Move Validation & Application ─────────────────────────────────────────

    /// <summary>
    /// Validates and applies a move. Returns a MoveResult describing the outcome.
    /// Does not mutate the input state.
    /// </summary>
    public static MoveResult ValidateAndApply(
        BoardStateData state, PieceColor turn,
        int fromRow, int fromCol, int toRow, int toCol)
    {
        if (!InBounds(fromRow, fromCol) || !InBounds(toRow, toCol))
            return MoveResult.Invalid("Position out of bounds");

        var board = state.Cells;
        var piece = board[fromRow][fromCol];

        if (!IsOwned(piece, turn))
            return MoveResult.Invalid("No piece of yours at that position");

        // Enforce pending capture: if mid-multi-capture, source must match locked position
        if (state.HasPendingCapture)
        {
            if (fromRow != state.PendingCaptureRow || fromCol != state.PendingCaptureCol)
                return MoveResult.Invalid("Must continue the capture chain from the current piece");
        }

        // Try capture first
        var captures = GetCaptures(board, fromRow, fromCol);
        var captureMatch = captures.FirstOrDefault(cap => cap.ToRow == toRow && cap.ToCol == toCol);

        if (captureMatch != default)
            return ApplyCapture(board, piece, fromRow, fromCol, toRow, toCol, captureMatch, turn);

        // Simple move path
        if (state.HasPendingCapture)
            return MoveResult.Invalid("Must continue the capture chain — a capture is available");

        if (HasAnyCapture(board, turn))
            return MoveResult.Invalid("Capture is mandatory when available");

        var simpleMoves = GetSimpleMoves(board, fromRow, fromCol);
        if (!simpleMoves.Any(m => m.ToRow == toRow && m.ToCol == toCol))
            return MoveResult.Invalid("Invalid move destination");

        return ApplySimpleMove(board, piece, fromRow, fromCol, toRow, toCol, turn);
    }

    private static MoveResult ApplySimpleMove(
        int[][] board, int piece,
        int fromRow, int fromCol, int toRow, int toCol,
        PieceColor turn)
    {
        var newBoard = Clone(board);
        newBoard[fromRow][fromCol] = Empty;
        newBoard[toRow][toCol] = Promote(piece, toRow);

        var newState = new BoardStateData { Cells = newBoard };
        var opponent = turn == PieceColor.Black ? PieceColor.White : PieceColor.Black;
        var gameOver = !HasPieces(newBoard, opponent) || !HasAnyValidMove(newBoard, opponent);

        return MoveResult.Success(newState, turnChanged: true, gameOver, gameOver ? turn : null);
    }

    private static MoveResult ApplyCapture(
        int[][] board, int piece,
        int fromRow, int fromCol, int toRow, int toCol,
        CaptureMove cap, PieceColor turn)
    {
        var newBoard = Clone(board);
        newBoard[fromRow][fromCol] = Empty;
        newBoard[cap.CapturedRow][cap.CapturedCol] = Empty;

        // Check promotion before deciding whether to continue
        var promoted = Promote(piece, toRow);
        newBoard[toRow][toCol] = promoted;
        bool wasPromoted = promoted != piece;

        // Promotion ends the multi-capture chain (Brazilian rule)
        bool moreCapturesAvailable = !wasPromoted && GetCaptures(newBoard, toRow, toCol).Count > 0;

        BoardStateData newState;
        if (moreCapturesAvailable)
        {
            newState = new BoardStateData
            {
                Cells = newBoard,
                PendingCaptureRow = toRow,
                PendingCaptureCol = toCol
            };
        }
        else
        {
            newState = new BoardStateData { Cells = newBoard };
        }

        var opponent = turn == PieceColor.Black ? PieceColor.White : PieceColor.Black;
        bool turnChanged = !moreCapturesAvailable;
        bool gameOver = turnChanged && (!HasPieces(newBoard, opponent) || !HasAnyValidMove(newBoard, opponent));

        return MoveResult.Success(newState, turnChanged, gameOver, gameOver ? turn : null);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static int Promote(int piece, int row) =>
        (piece == BlackMan && row == 7) ? BlackKing :
        (piece == WhiteMan && row == 0) ? WhiteKing : piece;

    private static int[][] Clone(int[][] board)
    {
        var clone = new int[8][];
        for (int r = 0; r < 8; r++) clone[r] = (int[])board[r].Clone();
        return clone;
    }
}

/// <summary>Describes a capture move: where the piece lands and which opponent it captures.</summary>
public readonly record struct CaptureMove(int ToRow, int ToCol, int CapturedRow, int CapturedCol);

/// <summary>Result of ValidateAndApply.</summary>
public class MoveResult
{
    public bool IsValid { get; private init; }
    public string? Error { get; private init; }
    public BoardStateData? NewState { get; private init; }
    public bool TurnChanged { get; private init; }
    public bool GameOver { get; private init; }
    public PieceColor? Winner { get; private init; }

    public static MoveResult Invalid(string error) =>
        new() { IsValid = false, Error = error };

    public static MoveResult Success(BoardStateData newState, bool turnChanged, bool gameOver, PieceColor? winner) =>
        new() { IsValid = true, NewState = newState, TurnChanged = turnChanged, GameOver = gameOver, Winner = winner };
}

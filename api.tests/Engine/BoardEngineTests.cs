using api.Engine;
using api.Models.Enums;

namespace api.tests.Engine;

public class BoardEngineTests
{
    // ── Initial Board ──────────────────────────────────────────────────────────

    [Fact]
    public void CreateInitialState_BlackHas12Pieces()
    {
        var state = BoardEngine.CreateInitialState();
        int count = state.Cells.SelectMany(r => r).Count(c => c == BoardEngine.BlackMan);
        Assert.Equal(12, count);
    }

    [Fact]
    public void CreateInitialState_WhiteHas12Pieces()
    {
        var state = BoardEngine.CreateInitialState();
        int count = state.Cells.SelectMany(r => r).Count(c => c == BoardEngine.WhiteMan);
        Assert.Equal(12, count);
    }

    [Fact]
    public void CreateInitialState_BlackOnRows0To2()
    {
        var state = BoardEngine.CreateInitialState();
        for (int r = 0; r < 3; r++)
            for (int c = 0; c < 8; c++)
                if ((r + c) % 2 == 1)
                    Assert.Equal(BoardEngine.BlackMan, state.Cells[r][c]);
    }

    [Fact]
    public void CreateInitialState_WhiteOnRows5To7()
    {
        var state = BoardEngine.CreateInitialState();
        for (int r = 5; r < 8; r++)
            for (int c = 0; c < 8; c++)
                if ((r + c) % 2 == 1)
                    Assert.Equal(BoardEngine.WhiteMan, state.Cells[r][c]);
    }

    [Fact]
    public void CreateInitialState_Rows3And4AreEmpty()
    {
        var state = BoardEngine.CreateInitialState();
        for (int r = 3; r <= 4; r++)
            for (int c = 0; c < 8; c++)
                Assert.Equal(BoardEngine.Empty, state.Cells[r][c]);
    }

    [Fact]
    public void CreateInitialState_NoPendingCapture()
    {
        var state = BoardEngine.CreateInitialState();
        Assert.False(state.HasPendingCapture);
    }

    // ── Serialization ──────────────────────────────────────────────────────────

    [Fact]
    public void Serialize_Deserialize_RoundTrip()
    {
        var original = BoardEngine.CreateInitialState();
        var json = original.Serialize();
        var restored = BoardStateData.Deserialize(json);

        for (int r = 0; r < 8; r++)
            for (int c = 0; c < 8; c++)
                Assert.Equal(original.Cells[r][c], restored.Cells[r][c]);
    }

    // ── GetSimpleMoves ──────────────────────────────────────────────────────────

    [Fact]
    public void GetSimpleMoves_BlackMan_MovesForwardOnly()
    {
        var board = EmptyBoard();
        board[3][2] = BoardEngine.BlackMan; // isolated piece in middle of board

        var moves = BoardEngine.GetSimpleMoves(board, 3, 2);

        // Black moves toward higher rows (down)
        Assert.Contains((4, 1), moves);
        Assert.Contains((4, 3), moves);
        Assert.DoesNotContain((2, 1), moves); // backward forbidden
        Assert.DoesNotContain((2, 3), moves);
        Assert.Equal(2, moves.Count);
    }

    [Fact]
    public void GetSimpleMoves_WhiteMan_MovesForwardOnly()
    {
        var board = EmptyBoard();
        board[4][3] = BoardEngine.WhiteMan; // isolated piece

        var moves = BoardEngine.GetSimpleMoves(board, 4, 3);

        // White moves toward lower rows (up)
        Assert.Contains((3, 2), moves);
        Assert.Contains((3, 4), moves);
        Assert.DoesNotContain((5, 2), moves); // backward forbidden
        Assert.DoesNotContain((5, 4), moves);
        Assert.Equal(2, moves.Count);
    }

    [Fact]
    public void GetSimpleMoves_BlackKing_MovesAllDirections_LongRange()
    {
        var board = EmptyBoard();
        board[3][3] = BoardEngine.BlackKing;

        var moves = BoardEngine.GetSimpleMoves(board, 3, 3);

        // Should be able to reach various squares in all 4 diagonals
        Assert.Contains((2, 2), moves);
        Assert.Contains((1, 1), moves);
        Assert.Contains((2, 4), moves);
        Assert.Contains((4, 2), moves);
        Assert.Contains((4, 4), moves);
        Assert.Contains((5, 5), moves);
        Assert.True(moves.Count > 4);
    }

    [Fact]
    public void GetSimpleMoves_BlockedByFriendly_StopsBeforeFriendly()
    {
        var board = EmptyBoard();
        board[3][3] = BoardEngine.BlackKing;
        board[5][5] = BoardEngine.BlackMan; // friendly blocks diagonal

        var moves = BoardEngine.GetSimpleMoves(board, 3, 3);

        Assert.Contains((4, 4), moves);
        Assert.DoesNotContain((5, 5), moves); // occupied by friendly
        Assert.DoesNotContain((6, 6), moves); // beyond block
    }

    // ── GetCaptures ───────────────────────────────────────────────────────────

    [Fact]
    public void GetCaptures_BlackMan_CapturesInAllDirections()
    {
        var board = EmptyBoard();
        board[3][3] = BoardEngine.BlackMan;
        board[2][2] = BoardEngine.WhiteMan; // backward-left
        board[4][4] = BoardEngine.WhiteMan; // forward-right

        var captures = BoardEngine.GetCaptures(board, 3, 3);

        Assert.Contains(captures, c => c.ToRow == 1 && c.ToCol == 1); // jump backward-left
        Assert.Contains(captures, c => c.ToRow == 5 && c.ToCol == 5); // jump forward-right
        Assert.Equal(2, captures.Count);
    }

    [Fact]
    public void GetCaptures_NoCapture_WhenLandingSquareBlocked()
    {
        var board = EmptyBoard();
        board[3][3] = BoardEngine.BlackMan;
        board[4][4] = BoardEngine.WhiteMan;
        board[5][5] = BoardEngine.BlackMan; // blocks landing

        var captures = BoardEngine.GetCaptures(board, 3, 3);

        Assert.DoesNotContain(captures, c => c.ToRow == 5 && c.ToCol == 5);
    }

    [Fact]
    public void GetCaptures_KingLongRange_CanCaptureFromDistance()
    {
        var board = EmptyBoard();
        board[0][0] = BoardEngine.BlackKing;
        board[5][5] = BoardEngine.WhiteMan; // opponent far away

        var captures = BoardEngine.GetCaptures(board, 0, 0);

        // King can land on any empty square beyond (5,5): (6,6) and (7,7)
        Assert.Contains(captures, c => c.ToRow == 6 && c.ToCol == 6 && c.CapturedRow == 5 && c.CapturedCol == 5);
        Assert.Contains(captures, c => c.ToRow == 7 && c.ToCol == 7 && c.CapturedRow == 5 && c.CapturedCol == 5);
    }

    [Fact]
    public void GetCaptures_King_BlockedByFriendlyAfterOpponent()
    {
        var board = EmptyBoard();
        board[0][0] = BoardEngine.BlackKing;
        board[3][3] = BoardEngine.WhiteMan;
        board[5][5] = BoardEngine.BlackMan; // friendly after opponent

        var captures = BoardEngine.GetCaptures(board, 0, 0);

        // Can land on (4,4) only, not (5,5) or beyond
        Assert.Contains(captures, c => c.ToRow == 4 && c.ToCol == 4);
        Assert.DoesNotContain(captures, c => c.ToRow == 5 && c.ToCol == 5);
        Assert.DoesNotContain(captures, c => c.ToRow == 6 && c.ToCol == 6);
    }

    [Fact]
    public void GetCaptures_King_BlockedByFriendlyBeforeOpponent_NoCapture()
    {
        // King at (0,0), friendly at (2,2), opponent at (4,4)
        // The friendly piece blocks before reaching the opponent → no capture in that diagonal
        var board = EmptyBoard();
        board[0][0] = BoardEngine.BlackKing;
        board[2][2] = BoardEngine.BlackMan; // friendly blocks the path first
        board[4][4] = BoardEngine.WhiteMan; // unreachable due to friendly

        var captures = BoardEngine.GetCaptures(board, 0, 0);

        // No capture possible in the blocked diagonal
        Assert.DoesNotContain(captures, c => c.CapturedRow == 4 && c.CapturedCol == 4);
    }

    // ── ValidateAndApply – Simple Moves ───────────────────────────────────────

    [Fact]
    public void ValidateAndApply_ValidSimpleMove_Success()
    {
        var state = BoardEngine.CreateInitialState();

        // Black piece at (2,1) moves to (3,0)
        var result = BoardEngine.ValidateAndApply(state, PieceColor.Black, 2, 1, 3, 0);

        Assert.True(result.IsValid);
        Assert.True(result.TurnChanged);
        Assert.False(result.GameOver);
        Assert.Equal(BoardEngine.Empty, result.NewState!.Cells[2][1]);
        Assert.Equal(BoardEngine.BlackMan, result.NewState.Cells[3][0]);
    }

    [Fact]
    public void ValidateAndApply_WrongColorPiece_Invalid()
    {
        var state = BoardEngine.CreateInitialState();

        // Black's turn but tries to move white piece at (5,0)
        var result = BoardEngine.ValidateAndApply(state, PieceColor.Black, 5, 0, 4, 1);

        Assert.False(result.IsValid);
        Assert.NotNull(result.Error);
    }

    [Fact]
    public void ValidateAndApply_ManMoveBackward_Invalid()
    {
        var board = EmptyBoard();
        board[3][3] = BoardEngine.BlackMan;
        var state = new BoardStateData { Cells = board };

        // Try to move backward (row decreases for black)
        var result = BoardEngine.ValidateAndApply(state, PieceColor.Black, 3, 3, 2, 2);

        Assert.False(result.IsValid);
    }

    [Fact]
    public void ValidateAndApply_OutOfBounds_Invalid()
    {
        var state = BoardEngine.CreateInitialState();
        var result = BoardEngine.ValidateAndApply(state, PieceColor.Black, -1, 0, 0, 1);
        Assert.False(result.IsValid);
    }

    // ── ValidateAndApply – Captures ───────────────────────────────────────────

    [Fact]
    public void ValidateAndApply_Capture_RemovesOpponentPiece()
    {
        var board = EmptyBoard();
        board[3][3] = BoardEngine.BlackMan;
        board[4][4] = BoardEngine.WhiteMan;
        var state = new BoardStateData { Cells = board };

        var result = BoardEngine.ValidateAndApply(state, PieceColor.Black, 3, 3, 5, 5);

        Assert.True(result.IsValid);
        Assert.Equal(BoardEngine.Empty, result.NewState!.Cells[3][3]);
        Assert.Equal(BoardEngine.Empty, result.NewState.Cells[4][4]); // opponent removed
        Assert.Equal(BoardEngine.BlackMan, result.NewState.Cells[5][5]);
    }

    [Fact]
    public void ValidateAndApply_MandatoryCapture_CannotMakeSimpleMove()
    {
        var board = EmptyBoard();
        board[3][3] = BoardEngine.BlackMan;
        board[4][4] = BoardEngine.WhiteMan; // capture available
        var state = new BoardStateData { Cells = board };

        // Try simple move instead of capturing
        var result = BoardEngine.ValidateAndApply(state, PieceColor.Black, 3, 3, 4, 2);

        Assert.False(result.IsValid);
        Assert.Contains("mandatory", result.Error!, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void ValidateAndApply_MultiCapture_TurnDoesNotChange()
    {
        var board = EmptyBoard();
        board[0][0] = BoardEngine.BlackMan;
        board[1][1] = BoardEngine.WhiteMan;
        board[3][3] = BoardEngine.WhiteMan; // second capture after landing at (2,2)
        var state = new BoardStateData { Cells = board };

        var result = BoardEngine.ValidateAndApply(state, PieceColor.Black, 0, 0, 2, 2);

        Assert.True(result.IsValid);
        Assert.False(result.TurnChanged); // more captures available
        Assert.True(result.NewState!.HasPendingCapture);
        Assert.Equal(2, result.NewState.PendingCaptureRow);
        Assert.Equal(2, result.NewState.PendingCaptureCol);
    }

    [Fact]
    public void ValidateAndApply_PendingCapture_SimpleMoveDenied()
    {
        // Piece at (2,2) has a pending capture but player tries a simple move instead
        var board = EmptyBoard();
        board[2][2] = BoardEngine.BlackMan;
        board[3][3] = BoardEngine.WhiteMan; // capture target still available
        var state = new BoardStateData
        {
            Cells = board,
            PendingCaptureRow = 2,
            PendingCaptureCol = 2
        };

        // Tries to make a simple forward move instead of continuing the chain
        var result = BoardEngine.ValidateAndApply(state, PieceColor.Black, 2, 2, 3, 1);

        Assert.False(result.IsValid);
        Assert.Contains("chain", result.Error!, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void ValidateAndApply_MultiCapture_MustContinueFromLandingSquare()
    {
        var board = EmptyBoard();
        board[0][0] = BoardEngine.BlackMan;
        board[1][1] = BoardEngine.WhiteMan;
        board[3][3] = BoardEngine.WhiteMan;
        var state = new BoardStateData { Cells = board, PendingCaptureRow = 2, PendingCaptureCol = 2 };

        // Try to move a different piece while mid-capture
        var result = BoardEngine.ValidateAndApply(state, PieceColor.Black, 0, 0, 1, 1);

        Assert.False(result.IsValid);
        Assert.Contains("chain", result.Error!, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void ValidateAndApply_MultiCapture_CompletesChain_TurnChanges()
    {
        var board = EmptyBoard();
        board[2][2] = BoardEngine.BlackMan;
        board[3][3] = BoardEngine.WhiteMan;
        var state = new BoardStateData
        {
            Cells = board,
            PendingCaptureRow = 2,
            PendingCaptureCol = 2
        };

        var result = BoardEngine.ValidateAndApply(state, PieceColor.Black, 2, 2, 4, 4);

        Assert.True(result.IsValid);
        Assert.True(result.TurnChanged); // no more captures → turn ends
        Assert.False(result.NewState!.HasPendingCapture);
    }

    // ── Promotion ──────────────────────────────────────────────────────────────

    [Fact]
    public void ValidateAndApply_BlackManReachesRow7_PromotesToKing()
    {
        var board = EmptyBoard();
        board[6][2] = BoardEngine.BlackMan;
        var state = new BoardStateData { Cells = board };

        var result = BoardEngine.ValidateAndApply(state, PieceColor.Black, 6, 2, 7, 1);

        Assert.True(result.IsValid);
        Assert.Equal(BoardEngine.BlackKing, result.NewState!.Cells[7][1]);
    }

    [Fact]
    public void ValidateAndApply_WhiteManReachesRow0_PromotesToKing()
    {
        var board = EmptyBoard();
        board[1][2] = BoardEngine.WhiteMan;
        var state = new BoardStateData { Cells = board };

        var result = BoardEngine.ValidateAndApply(state, PieceColor.White, 1, 2, 0, 1);

        Assert.True(result.IsValid);
        Assert.Equal(BoardEngine.WhiteKing, result.NewState!.Cells[0][1]);
    }

    [Fact]
    public void ValidateAndApply_Promotion_StopsMultiCapture()
    {
        var board = EmptyBoard();
        board[6][2] = BoardEngine.BlackMan;
        board[7][3] = BoardEngine.WhiteMan; // would be capture target but promotion stops chain

        // Black captures forward... wait, (6,2) capturing (7,3) would land at (8,4) which is out of bounds
        // Let's set up: black at (6,4), white at (7,5)... lands at row 8, out of bounds
        // Better: black captures backward onto row 7
        // black at (6,0), white at (7,1)... but landing would be (8,2) which is OOB
        // Let's use: black at (6,4), white at (5,3), lands at (4,2) - NOT promotion
        // For promotion via capture: black at (6,2), captures (7,1) - but lands at (8,0) which is OOB

        // Actually: promotion requires landing on row 7 for black.
        // So: black at (5,1), white at (6,2), lands at (7,3) → promotion!
        // After promotion, even if there are more captures, turn should end.
        board = EmptyBoard();
        board[5][1] = BoardEngine.BlackMan;
        board[6][2] = BoardEngine.WhiteMan;
        board[6][4] = BoardEngine.WhiteMan; // second target accessible from (7,3) if not promoted
        var state2 = new BoardStateData { Cells = board };

        var result = BoardEngine.ValidateAndApply(state2, PieceColor.Black, 5, 1, 7, 3);

        Assert.True(result.IsValid);
        Assert.Equal(BoardEngine.BlackKing, result.NewState!.Cells[7][3]);
        // Turn must change despite potential further captures (promotion stops chain)
        Assert.True(result.TurnChanged);
        Assert.False(result.NewState.HasPendingCapture);
    }

    // ── Win Condition ──────────────────────────────────────────────────────────

    [Fact]
    public void ValidateAndApply_LastWhitePieceCaptured_BlackWins()
    {
        var board = EmptyBoard();
        board[3][3] = BoardEngine.BlackMan;
        board[4][4] = BoardEngine.WhiteMan; // last white piece
        var state = new BoardStateData { Cells = board };

        var result = BoardEngine.ValidateAndApply(state, PieceColor.Black, 3, 3, 5, 5);

        Assert.True(result.IsValid);
        Assert.True(result.GameOver);
        Assert.Equal(PieceColor.Black, result.Winner);
    }

    [Fact]
    public void ValidateAndApply_OpponentHasNoValidMoves_CurrentWins()
    {
        // White piece cornered with no moves
        var board = EmptyBoard();
        board[1][1] = BoardEngine.BlackMan;
        board[0][0] = BoardEngine.WhiteMan; // cornered, blocked by black at (1,1)
        // White can move to (1,1) which is occupied or... wait
        // White at (0,0) tries to move forward (up for white = row -1) which is OOB
        // So white has no moves after black moves
        board[3][3] = BoardEngine.BlackMan; // another black piece
        var state = new BoardStateData { Cells = board };

        // Black moves to (2,2), leaving white at (0,0) with no moves (trying to go to row -1)
        var result = BoardEngine.ValidateAndApply(state, PieceColor.Black, 1, 1, 2, 0);

        Assert.True(result.IsValid);
        // White at (0,0) still has piece but... (0,0)+(−1,−1)=(−1,−1) and (0,0)+(−1,+1)=(−1,1) both OOB
        // So white has no valid moves → black wins
        Assert.True(result.GameOver);
        Assert.Equal(PieceColor.Black, result.Winner);
    }

    // ── HasAnyCapture / HasAnyValidMove / HasPieces ───────────────────────────

    [Fact]
    public void HasAnyCapture_WhenCaptureExists_ReturnsTrue()
    {
        var board = EmptyBoard();
        board[3][3] = BoardEngine.BlackMan;
        board[4][4] = BoardEngine.WhiteMan;

        Assert.True(BoardEngine.HasAnyCapture(board, PieceColor.Black));
    }

    [Fact]
    public void HasAnyCapture_WhenNoCaptureExists_ReturnsFalse()
    {
        var state = BoardEngine.CreateInitialState();
        // Initial position: no captures possible
        Assert.False(BoardEngine.HasAnyCapture(state.Cells, PieceColor.Black));
        Assert.False(BoardEngine.HasAnyCapture(state.Cells, PieceColor.White));
    }

    [Fact]
    public void HasAnyValidMove_FullBoard_ReturnsTrue()
    {
        var state = BoardEngine.CreateInitialState();
        Assert.True(BoardEngine.HasAnyValidMove(state.Cells, PieceColor.Black));
        Assert.True(BoardEngine.HasAnyValidMove(state.Cells, PieceColor.White));
    }

    [Fact]
    public void HasPieces_EmptyBoard_ReturnsFalse()
    {
        var board = EmptyBoard();
        Assert.False(BoardEngine.HasPieces(board, PieceColor.Black));
        Assert.False(BoardEngine.HasPieces(board, PieceColor.White));
    }

    [Fact]
    public void HasPieces_InitialBoard_ReturnsTrue()
    {
        var state = BoardEngine.CreateInitialState();
        Assert.True(BoardEngine.HasPieces(state.Cells, PieceColor.Black));
        Assert.True(BoardEngine.HasPieces(state.Cells, PieceColor.White));
    }

    // ── King Long-range Move/Capture Integration ───────────────────────────────

    [Fact]
    public void ValidateAndApply_King_SimpleLongRangeMove()
    {
        var board = EmptyBoard();
        board[0][0] = BoardEngine.BlackKing;
        var state = new BoardStateData { Cells = board };

        var result = BoardEngine.ValidateAndApply(state, PieceColor.Black, 0, 0, 7, 7);

        Assert.True(result.IsValid);
        Assert.Equal(BoardEngine.BlackKing, result.NewState!.Cells[7][7]);
        Assert.Equal(BoardEngine.Empty, result.NewState.Cells[0][0]);
    }

    [Fact]
    public void ValidateAndApply_King_LongRangeCapture()
    {
        var board = EmptyBoard();
        board[0][0] = BoardEngine.BlackKing;
        board[4][4] = BoardEngine.WhiteMan;
        var state = new BoardStateData { Cells = board };

        // King captures white at (4,4), lands at (5,5)
        var result = BoardEngine.ValidateAndApply(state, PieceColor.Black, 0, 0, 5, 5);

        Assert.True(result.IsValid);
        Assert.Equal(BoardEngine.Empty, result.NewState!.Cells[4][4]);
        Assert.Equal(BoardEngine.BlackKing, result.NewState.Cells[5][5]);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static int[][] EmptyBoard()
    {
        var board = new int[8][];
        for (int r = 0; r < 8; r++) board[r] = new int[8];
        return board;
    }
}

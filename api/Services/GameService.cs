using api.Data;
using api.DTOs.Games;
using api.Models;
using api.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace api.Services;

public class GameService(DamasDbContext db) : IGameService
{
    public async Task<GameResponse> CreateAsync(CreateGameRequest request, CancellationToken ct = default)
    {
        var game = new Game
        {
            Id = Guid.NewGuid(),
            PlayerBlackId = request.PlayerId,
            Status = GameStatus.WaitingForPlayers,
            BoardState = "{}",
            CurrentTurn = PieceColor.Black,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        db.Games.Add(game);
        await db.SaveChangesAsync(ct);

        return ToResponse(game);
    }

    public async Task<GameResponse?> JoinAsync(Guid gameId, JoinGameRequest request, CancellationToken ct = default)
    {
        var game = await db.Games.FindAsync([gameId], ct);
        if (game is null || game.Status != GameStatus.WaitingForPlayers)
            return null;

        game.PlayerWhiteId = request.PlayerId;
        game.Status = GameStatus.InProgress;
        game.UpdatedAt = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync(ct);

        return ToResponse(game);
    }

    public async Task<GameResponse?> MakeMoveAsync(Guid gameId, MakeMoveRequest request, CancellationToken ct = default)
    {
        var game = await db.Games.FindAsync([gameId], ct);
        if (game is null || game.Status != GameStatus.InProgress)
            return null;

        var move = new Move
        {
            Id = Guid.NewGuid(),
            GameId = gameId,
            PlayerId = request.PlayerId,
            FromRow = request.FromRow,
            FromCol = request.FromCol,
            ToRow = request.ToRow,
            ToCol = request.ToCol,
            CreatedAt = DateTimeOffset.UtcNow
        };

        game.CurrentTurn = game.CurrentTurn == PieceColor.Black ? PieceColor.White : PieceColor.Black;
        game.UpdatedAt = DateTimeOffset.UtcNow;

        db.Moves.Add(move);
        await db.SaveChangesAsync(ct);

        return ToResponse(game);
    }

    public async Task<GameResponse?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var game = await db.Games.FindAsync([id], ct);
        return game is null ? null : ToResponse(game);
    }

    public async Task<IEnumerable<GameResponse>> GetActiveAsync(CancellationToken ct = default)
    {
        return await db.Games
            .Where(g => g.Status == GameStatus.WaitingForPlayers || g.Status == GameStatus.InProgress)
            .Select(g => new GameResponse(
                g.Id, g.PlayerBlackId, g.PlayerWhiteId,
                g.Status, g.BoardState, g.CurrentTurn,
                g.CreatedAt, g.UpdatedAt))
            .ToListAsync(ct);
    }

    private static GameResponse ToResponse(Game g) =>
        new(g.Id, g.PlayerBlackId, g.PlayerWhiteId,
            g.Status, g.BoardState, g.CurrentTurn,
            g.CreatedAt, g.UpdatedAt);
}

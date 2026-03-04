using api.Data;
using api.DTOs.Games;
using api.Engine;
using api.Hubs;
using api.Models;
using api.Models.Enums;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace api.Services;

public class GameService(DamasDbContext db, IHubContext<GameHub> hub, IGameCacheService cache) : IGameService
{
    public async Task<ServiceResult<GameResponse>> CreateAsync(Guid playerId, CancellationToken ct = default)
    {
        var initialState = BoardEngine.CreateInitialState();

        var game = new Game
        {
            Id = Guid.NewGuid(),
            PlayerBlackId = playerId,
            Status = GameStatus.WaitingForPlayers,
            BoardState = initialState.Serialize(),
            CurrentTurn = PieceColor.Black,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        db.Games.Add(game);
        await db.SaveChangesAsync(ct);
        await cache.SetBoardStateAsync(game.Id, initialState, ct);

        return ServiceResult<GameResponse>.Ok(ToResponse(game));
    }

    public async Task<ServiceResult<GameResponse>> JoinAsync(Guid gameId, Guid playerId, CancellationToken ct = default)
    {
        var game = await db.Games.FindAsync([gameId], ct);

        if (game is null)
            return ServiceResult<GameResponse>.NotFound("Game not found");

        if (game.Status != GameStatus.WaitingForPlayers)
            return ServiceResult<GameResponse>.Fail("Game is not accepting players");

        if (game.PlayerBlackId == playerId)
            return ServiceResult<GameResponse>.Fail("You are already in this game");

        game.PlayerWhiteId = playerId;
        game.Status = GameStatus.InProgress;
        game.UpdatedAt = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync(ct);

        await hub.Clients.Group(gameId.ToString())
            .SendAsync("GameStarted", ToResponse(game), ct);

        return ServiceResult<GameResponse>.Ok(ToResponse(game));
    }

    public async Task<ServiceResult<GameResponse>> MakeMoveAsync(
        Guid gameId, MakeMoveRequest request, Guid playerId, CancellationToken ct = default)
    {
        var game = await db.Games.FindAsync([gameId], ct);

        if (game is null)
            return ServiceResult<GameResponse>.NotFound("Game not found");

        if (game.Status != GameStatus.InProgress)
            return ServiceResult<GameResponse>.Fail("Game is not in progress");

        // Determine player's color
        PieceColor playerColor;
        if (game.PlayerBlackId == playerId) playerColor = PieceColor.Black;
        else if (game.PlayerWhiteId == playerId) playerColor = PieceColor.White;
        else return ServiceResult<GameResponse>.Fail("You are not a participant in this game");

        if (game.CurrentTurn != playerColor)
            return ServiceResult<GameResponse>.Fail("It is not your turn");

        // Try cache first, fallback to DB
        var state = await cache.GetBoardStateAsync(gameId, ct)
                    ?? BoardStateData.Deserialize(game.BoardState);

        var result = BoardEngine.ValidateAndApply(
            state, playerColor,
            request.FromRow, request.FromCol,
            request.ToRow, request.ToCol);

        if (!result.IsValid)
            return ServiceResult<GameResponse>.Fail(result.Error!);

        // Persist move record
        db.Moves.Add(new Move
        {
            Id = Guid.NewGuid(),
            GameId = gameId,
            PlayerId = playerId,
            FromRow = request.FromRow,
            FromCol = request.FromCol,
            ToRow = request.ToRow,
            ToCol = request.ToCol,
            CreatedAt = DateTimeOffset.UtcNow
        });

        // Update game state
        game.BoardState = result.NewState!.Serialize();
        game.UpdatedAt = DateTimeOffset.UtcNow;

        if (result.GameOver)
        {
            game.Status = GameStatus.Completed;
            game.WinnerId = result.Winner == PieceColor.Black ? game.PlayerBlackId : game.PlayerWhiteId;
        }
        else if (result.TurnChanged)
        {
            game.CurrentTurn = playerColor == PieceColor.Black ? PieceColor.White : PieceColor.Black;
        }

        await cache.SetBoardStateAsync(gameId, result.NewState!, ct);
        await db.SaveChangesAsync(ct);

        var response = ToResponse(game);
        await hub.Clients.Group(gameId.ToString())
            .SendAsync("MoveMade", response, ct);

        return ServiceResult<GameResponse>.Ok(response);
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
                g.Id, g.PlayerBlackId, g.PlayerWhiteId, g.WinnerId,
                g.Status, g.BoardState, g.CurrentTurn,
                g.CreatedAt, g.UpdatedAt))
            .ToListAsync(ct);
    }

    private static GameResponse ToResponse(Game g) =>
        new(g.Id, g.PlayerBlackId, g.PlayerWhiteId, g.WinnerId,
            g.Status, g.BoardState, g.CurrentTurn,
            g.CreatedAt, g.UpdatedAt);
}

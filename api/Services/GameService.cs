using api.Data;
using api.DTOs.Games;
using api.DTOs.Players;
using api.Engine;
using api.Hubs;
using api.Models;
using api.Models.Enums;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace api.Services;

public class GameService(DamasDbContext db, IHubContext<GameHub> hub, IGameCacheService cache, IOnlinePlayerTracker tracker, ISettlementService settlement) : IGameService
{
    public async Task<ServiceResult<GameResponse>> CreateAsync(Guid playerId, long betAmountSats = 0, CancellationToken ct = default)
    {
        var existingPending = await db.Games
            .Include(g => g.PlayerBlack)
            .FirstOrDefaultAsync(g => g.PlayerBlackId == playerId && g.Status == GameStatus.WaitingForPlayers, ct);

        if (existingPending is not null)
        {
            // Same type requested — return the existing game (idempotent)
            if (existingPending.BetAmountSats == betAmountSats)
                return ServiceResult<GameResponse>.Ok(ToResponse(existingPending));

            // Different type — discard the old pending game and create the requested one.
            // Bets are only locked on JOIN, so it is safe to delete here.
            db.Games.Remove(existingPending);
            await cache.InvalidateAsync(existingPending.Id, ct);
        }

        var initialState = BoardEngine.CreateInitialState();

        var game = new Game
        {
            Id = Guid.NewGuid(),
            PlayerBlackId = playerId,
            Status = GameStatus.WaitingForPlayers,
            BoardState = initialState.Serialize(),
            CurrentTurn = PieceColor.Black,
            BetAmountSats = betAmountSats,
            BetSettled = false,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        db.Games.Add(game);
        await db.SaveChangesAsync(ct);
        await cache.SetBoardStateAsync(game.Id, initialState, ct);

        // Load player navigation property for username
        await db.Entry(game).Reference(g => g.PlayerBlack).LoadAsync(ct);

        await BroadcastGameListAsync(ct);

        return ServiceResult<GameResponse>.Ok(ToResponse(game));
    }

    public async Task<ServiceResult<GameResponse>> JoinAsync(Guid gameId, Guid playerId, CancellationToken ct = default)
    {
        var game = await db.Games
            .Include(g => g.PlayerBlack)
            .Include(g => g.PlayerWhite)
            .FirstOrDefaultAsync(g => g.Id == gameId, ct);

        if (game is null)
            return ServiceResult<GameResponse>.NotFound("Game not found");

        if (game.Status != GameStatus.WaitingForPlayers)
            return ServiceResult<GameResponse>.Fail("Game is not accepting players");

        if (game.PlayerBlackId == playerId)
            return ServiceResult<GameResponse>.Fail("You are already in this game");

        // Lock bets from both players before starting the game
        if (game.BetAmountSats > 0)
        {
            var lockResult = await settlement.LockBetsAsync(
                game.Id, game.PlayerBlackId!.Value, playerId, game.BetAmountSats, ct);
            if (!lockResult.IsSuccess)
                return ServiceResult<GameResponse>.Fail(lockResult.Error!);
        }

        game.PlayerWhiteId = playerId;
        game.Status = GameStatus.InProgress;
        game.UpdatedAt = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync(ct);

        // Reload white player navigation property after assignment
        await db.Entry(game).Reference(g => g.PlayerWhite).LoadAsync(ct);

        var response = ToResponse(game);
        await hub.Clients.Group(gameId.ToString())
            .SendAsync("GameStarted", response, ct);

        await BroadcastGameListAsync(ct);

        // Mark both players as InGame in presence tracker
        tracker.SetInGame(game.PlayerBlackId!.Value, gameId);
        tracker.SetInGame(playerId, gameId);
        await BroadcastOnlinePlayersAsync(ct);

        return ServiceResult<GameResponse>.Ok(response);
    }

    public async Task<ServiceResult<GameResponse>> MakeMoveAsync(
        Guid gameId, MakeMoveRequest request, Guid playerId, CancellationToken ct = default)
    {
        var game = await db.Games
            .Include(g => g.PlayerBlack)
            .Include(g => g.PlayerWhite)
            .FirstOrDefaultAsync(g => g.Id == gameId, ct);

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

        if (result.GameOver && game.BetAmountSats > 0 && !game.BetSettled && game.WinnerId.HasValue)
        {
            var loserId = game.WinnerId == game.PlayerBlackId ? game.PlayerWhiteId!.Value : game.PlayerBlackId!.Value;
            await settlement.SettleAsync(game.Id, game.WinnerId.Value, loserId, game.BetAmountSats, ct);
            game.BetSettled = true;
            await db.SaveChangesAsync(ct);
        }

        var response = ToResponse(game);
        await hub.Clients.Group(gameId.ToString())
            .SendAsync("MoveMade", response, ct);

        if (result.GameOver)
        {
            await BroadcastGameListAsync(ct);
            tracker.SetOnline(game.PlayerBlackId!.Value);
            if (game.PlayerWhiteId.HasValue) tracker.SetOnline(game.PlayerWhiteId.Value);
            await BroadcastOnlinePlayersAsync(ct);
        }

        return ServiceResult<GameResponse>.Ok(response);
    }

    public async Task<ServiceResult<GameResponse>> SkipTurnAsync(Guid gameId, Guid playerId, CancellationToken ct = default)
    {
        var game = await db.Games
            .Include(g => g.PlayerBlack)
            .Include(g => g.PlayerWhite)
            .FirstOrDefaultAsync(g => g.Id == gameId, ct);

        if (game is null)
            return ServiceResult<GameResponse>.NotFound("Game not found");

        if (game.Status != GameStatus.InProgress)
            return ServiceResult<GameResponse>.Fail("Game is not in progress");

        PieceColor playerColor;
        if (game.PlayerBlackId == playerId) playerColor = PieceColor.Black;
        else if (game.PlayerWhiteId == playerId) playerColor = PieceColor.White;
        else return ServiceResult<GameResponse>.Fail("You are not a participant in this game");

        if (game.CurrentTurn != playerColor)
            return ServiceResult<GameResponse>.Fail("It is not your turn");

        game.CurrentTurn = playerColor == PieceColor.Black ? PieceColor.White : PieceColor.Black;
        game.UpdatedAt = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync(ct);

        var response = ToResponse(game);
        await hub.Clients.Group(gameId.ToString())
            .SendAsync("MoveMade", response, ct);

        return ServiceResult<GameResponse>.Ok(response);
    }

    public async Task<ServiceResult<GameResponse>> ResignAsync(Guid gameId, Guid playerId, CancellationToken ct = default)
    {
        var game = await db.Games
            .Include(g => g.PlayerBlack)
            .Include(g => g.PlayerWhite)
            .FirstOrDefaultAsync(g => g.Id == gameId, ct);

        if (game is null)
            return ServiceResult<GameResponse>.NotFound("Game not found");

        if (game.Status != GameStatus.InProgress)
            return ServiceResult<GameResponse>.Fail("Game is not in progress");

        Guid winnerId;
        if (game.PlayerBlackId == playerId)
            winnerId = game.PlayerWhiteId!.Value;
        else if (game.PlayerWhiteId == playerId)
            winnerId = game.PlayerBlackId!.Value;
        else
            return ServiceResult<GameResponse>.Fail("You are not a participant in this game");

        game.Status = GameStatus.Completed;
        game.WinnerId = winnerId;
        game.UpdatedAt = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync(ct);

        if (game.BetAmountSats > 0 && !game.BetSettled)
        {
            var loserId = winnerId == game.PlayerBlackId ? game.PlayerWhiteId!.Value : game.PlayerBlackId!.Value;
            await settlement.SettleAsync(game.Id, winnerId, loserId, game.BetAmountSats, ct);
            game.BetSettled = true;
            await db.SaveChangesAsync(ct);
        }

        var response = ToResponse(game);
        await hub.Clients.Group(gameId.ToString()).SendAsync("MoveMade", response, ct);
        await BroadcastGameListAsync(ct);

        tracker.SetOnline(game.PlayerBlackId!.Value);
        if (game.PlayerWhiteId.HasValue) tracker.SetOnline(game.PlayerWhiteId.Value);
        await BroadcastOnlinePlayersAsync(ct);

        return ServiceResult<GameResponse>.Ok(response);
    }

    public async Task<GameResponse?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var game = await db.Games
            .Include(g => g.PlayerBlack)
            .Include(g => g.PlayerWhite)
            .FirstOrDefaultAsync(g => g.Id == id, ct);
        return game is null ? null : ToResponse(game);
    }

    public async Task<IEnumerable<GameResponse>> GetCompletedByPlayerAsync(Guid playerId, CancellationToken ct = default)
    {
        var games = await db.Games
            .Include(g => g.PlayerBlack)
            .Include(g => g.PlayerWhite)
            .Where(g => g.Status == GameStatus.Completed &&
                       (g.PlayerBlackId == playerId || g.PlayerWhiteId == playerId))
            .OrderByDescending(g => g.UpdatedAt)
            .ToListAsync(ct);
        return games.Select(ToResponse);
    }

    public async Task<IEnumerable<MoveResponse>> GetMovesAsync(Guid gameId, CancellationToken ct = default)
    {
        return await db.Moves
            .Where(m => m.GameId == gameId)
            .OrderBy(m => m.CreatedAt)
            .Select(m => new MoveResponse(m.Id, m.PlayerId, m.FromRow, m.FromCol, m.ToRow, m.ToCol, m.CreatedAt))
            .ToListAsync(ct);
    }

    public async Task<PlayerStatsResponse> GetPlayerStatsAsync(Guid playerId, CancellationToken ct = default)
    {
        var counts = await db.Games
            .Where(g => g.Status == GameStatus.Completed &&
                       (g.PlayerBlackId == playerId || g.PlayerWhiteId == playerId))
            .Select(g => new { g.WinnerId })
            .ToListAsync(ct);

        var total = counts.Count;
        var wins = counts.Count(g => g.WinnerId == playerId);
        return new PlayerStatsResponse(wins, total - wins, total);
    }

    public async Task<IEnumerable<GameResponse>> GetActiveAsync(CancellationToken ct = default)
    {
        var games = await db.Games
            .Include(g => g.PlayerBlack)
            .Include(g => g.PlayerWhite)
            .Where(g => g.Status == GameStatus.WaitingForPlayers || g.Status == GameStatus.InProgress)
            .OrderByDescending(g => g.UpdatedAt)
            .ToListAsync(ct);
        return games.Select(ToResponse);
    }

    private async Task BroadcastGameListAsync(CancellationToken ct = default)
    {
        try
        {
            var games = (await GetActiveAsync(ct)).ToList();
            try { await cache.SetGameListAsync(games, ct); } catch { /* cache failure is non-fatal */ }
            await hub.Clients.Group("lobby").SendAsync("GameListUpdated", games, ct);
        }
        catch { /* broadcast failures must not affect the HTTP response */ }
    }

    private async Task BroadcastOnlinePlayersAsync(CancellationToken ct = default)
    {
        try
        {
            await hub.Clients.Group("lobby").SendAsync("OnlinePlayersUpdated", tracker.GetAll(), ct);
        }
        catch { /* broadcast failures must not affect the HTTP response */ }
    }

    public async Task<ServiceResult<bool>> CancelAsync(Guid gameId, Guid playerId, CancellationToken ct = default)
    {
        var game = await db.Games.FindAsync([gameId], ct);

        if (game is null)
            return ServiceResult<bool>.NotFound("game_not_found");

        if (game.PlayerBlackId != playerId)
            return ServiceResult<bool>.Fail("not_creator");

        if (game.Status != GameStatus.WaitingForPlayers)
            return ServiceResult<bool>.Fail("game_already_started");

        db.Games.Remove(game);
        await db.SaveChangesAsync(ct);

        // No bets are locked at WaitingForPlayers stage (lock happens on join)
        await BroadcastGameListAsync(ct);

        return ServiceResult<bool>.Ok(true);
    }

    private static GameResponse ToResponse(Game g) =>
        new(g.Id,
            g.PlayerBlackId, g.PlayerBlack?.Username, g.PlayerBlack?.AvatarUrl,
            g.PlayerWhiteId, g.PlayerWhite?.Username, g.PlayerWhite?.AvatarUrl,
            g.WinnerId, g.Status, g.BoardState, g.CurrentTurn,
            g.BetAmountSats, g.CreatedAt, g.UpdatedAt);
}

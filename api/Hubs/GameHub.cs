using api.Services;
using Microsoft.AspNetCore.SignalR;

namespace api.Hubs;

public class GameHub(
    IGameCacheService cache,
    IGameService gameService,
    IGameWatcherService watchers) : Hub
{
    /// <summary>Called by the two players — joins the game room without counting as a spectator.</summary>
    public async Task JoinGameRoom(string gameId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, gameId);

        if (Guid.TryParse(gameId, out var id))
        {
            var state = await cache.GetBoardStateAsync(id);
            if (state is not null)
                await Clients.Caller.SendAsync("GameState", state);
        }
    }

    /// <summary>Called by spectators — joins the game room and increments the watcher count.</summary>
    public async Task WatchGame(string gameId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, gameId);

        var count = watchers.AddWatcher(gameId, Context.ConnectionId);
        await Clients.Group(gameId).SendAsync("WatchersUpdated", count);

        if (Guid.TryParse(gameId, out var id))
        {
            var state = await cache.GetBoardStateAsync(id);
            if (state is not null)
                await Clients.Caller.SendAsync("GameState", state);
        }
    }

    public async Task StopWatching(string gameId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, gameId);

        var count = watchers.RemoveWatcher(Context.ConnectionId, out _);
        await Clients.Group(gameId).SendAsync("WatchersUpdated", count);
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var count = watchers.RemoveWatcher(Context.ConnectionId, out var gameId);
        if (gameId is not null)
            await Clients.Group(gameId).SendAsync("WatchersUpdated", count);

        await base.OnDisconnectedAsync(exception);
    }

    public async Task JoinLobby()
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, "lobby");

        var cached = await cache.GetGameListAsync();
        if (cached is not null)
        {
            await Clients.Caller.SendAsync("GameListUpdated", cached);
        }
        else
        {
            var games = await gameService.GetActiveAsync();
            await Clients.Caller.SendAsync("GameListUpdated", games);
        }
    }

    public async Task LeaveLobby()
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, "lobby");
    }
}

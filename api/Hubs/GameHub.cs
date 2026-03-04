using api.Services;
using Microsoft.AspNetCore.SignalR;

namespace api.Hubs;

public class GameHub(IGameCacheService cache) : Hub
{
    public async Task WatchGame(string gameId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, gameId);

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
    }
}

using api.Engine;
using Microsoft.Extensions.Caching.Distributed;
using System.Text;

namespace api.Services;

public class GameCacheService(IDistributedCache cache) : IGameCacheService
{
    private static readonly DistributedCacheEntryOptions CacheOptions = new()
    {
        AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(24)
    };

    private static string Key(Guid gameId) => $"game:{gameId}";

    public async Task<BoardStateData?> GetBoardStateAsync(Guid gameId, CancellationToken ct = default)
    {
        var bytes = await cache.GetAsync(Key(gameId), ct);
        if (bytes is null) return null;
        return BoardStateData.Deserialize(Encoding.UTF8.GetString(bytes));
    }

    public async Task SetBoardStateAsync(Guid gameId, BoardStateData state, CancellationToken ct = default)
    {
        var bytes = Encoding.UTF8.GetBytes(state.Serialize());
        await cache.SetAsync(Key(gameId), bytes, CacheOptions, ct);
    }

    public async Task InvalidateAsync(Guid gameId, CancellationToken ct = default)
    {
        await cache.RemoveAsync(Key(gameId), ct);
    }
}

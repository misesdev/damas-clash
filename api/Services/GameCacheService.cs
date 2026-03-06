using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using api.DTOs.Games;
using api.Engine;
using Microsoft.Extensions.Caching.Distributed;

namespace api.Services;

public class GameCacheService(IDistributedCache cache) : IGameCacheService
{
    private static readonly DistributedCacheEntryOptions BoardOptions = new()
    {
        AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(24)
    };

    private static readonly DistributedCacheEntryOptions ListOptions = new()
    {
        AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(24)
    };

    private static readonly JsonSerializerOptions JsonOpts = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter() }
    };

    private static string BoardKey(Guid gameId) => $"game:{gameId}";
    private const string GameListKey = "gamelist:active";

    // ── Board state ───────────────────────────────────────────────────────────

    public async Task<BoardStateData?> GetBoardStateAsync(Guid gameId, CancellationToken ct = default)
    {
        var bytes = await cache.GetAsync(BoardKey(gameId), ct);
        if (bytes is null) return null;
        return BoardStateData.Deserialize(Encoding.UTF8.GetString(bytes));
    }

    public async Task SetBoardStateAsync(Guid gameId, BoardStateData state, CancellationToken ct = default)
    {
        var bytes = Encoding.UTF8.GetBytes(state.Serialize());
        await cache.SetAsync(BoardKey(gameId), bytes, BoardOptions, ct);
    }

    public async Task InvalidateAsync(Guid gameId, CancellationToken ct = default)
    {
        await cache.RemoveAsync(BoardKey(gameId), ct);
    }

    // ── Game list ─────────────────────────────────────────────────────────────

    public async Task<IReadOnlyList<GameResponse>?> GetGameListAsync(CancellationToken ct = default)
    {
        var bytes = await cache.GetAsync(GameListKey, ct);
        if (bytes is null) return null;
        return JsonSerializer.Deserialize<List<GameResponse>>(bytes, JsonOpts);
    }

    public async Task SetGameListAsync(IEnumerable<GameResponse> games, CancellationToken ct = default)
    {
        var bytes = JsonSerializer.SerializeToUtf8Bytes(games, JsonOpts);
        await cache.SetAsync(GameListKey, bytes, ListOptions, ct);
    }

    public async Task InvalidateGameListAsync(CancellationToken ct = default)
    {
        await cache.RemoveAsync(GameListKey, ct);
    }
}

using api.Engine;
using api.Services;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

namespace api.tests.Services;

public class GameCacheServiceTests
{
    private static GameCacheService CreateService()
    {
        var cache = new MemoryDistributedCache(Options.Create(new MemoryDistributedCacheOptions()));
        return new GameCacheService(cache);
    }

    [Fact]
    public async Task SetAndGet_ReturnsBoardState()
    {
        var service = CreateService();
        var gameId = Guid.NewGuid();
        var state = BoardEngine.CreateInitialState();

        await service.SetBoardStateAsync(gameId, state);
        var result = await service.GetBoardStateAsync(gameId);

        Assert.NotNull(result);
        Assert.Equal(state.Serialize(), result.Serialize());
    }

    [Fact]
    public async Task Get_NonExistentKey_ReturnsNull()
    {
        var service = CreateService();
        var result = await service.GetBoardStateAsync(Guid.NewGuid());
        Assert.Null(result);
    }

    [Fact]
    public async Task Invalidate_RemovesKey()
    {
        var service = CreateService();
        var gameId = Guid.NewGuid();
        var state = BoardEngine.CreateInitialState();

        await service.SetBoardStateAsync(gameId, state);
        await service.InvalidateAsync(gameId);
        var result = await service.GetBoardStateAsync(gameId);

        Assert.Null(result);
    }

    [Fact]
    public async Task SetOverwrite_ReturnsNewValue()
    {
        var service = CreateService();
        var gameId = Guid.NewGuid();
        var initial = BoardEngine.CreateInitialState();

        await service.SetBoardStateAsync(gameId, initial);

        // Mutate state
        var modified = BoardEngine.CreateInitialState();
        modified.PendingCaptureRow = 3;
        modified.PendingCaptureCol = 4;
        await service.SetBoardStateAsync(gameId, modified);

        var result = await service.GetBoardStateAsync(gameId);
        Assert.NotNull(result);
        Assert.Equal(3, result.PendingCaptureRow);
        Assert.Equal(4, result.PendingCaptureCol);
    }
}

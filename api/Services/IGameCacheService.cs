using api.DTOs.Games;
using api.Engine;

namespace api.Services;

public interface IGameCacheService
{
    Task<BoardStateData?> GetBoardStateAsync(Guid gameId, CancellationToken ct = default);
    Task SetBoardStateAsync(Guid gameId, BoardStateData state, CancellationToken ct = default);
    Task InvalidateAsync(Guid gameId, CancellationToken ct = default);

    Task<IReadOnlyList<GameResponse>?> GetGameListAsync(CancellationToken ct = default);
    Task SetGameListAsync(IEnumerable<GameResponse> games, CancellationToken ct = default);
    Task InvalidateGameListAsync(CancellationToken ct = default);
}

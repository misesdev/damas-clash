using api.DTOs.Games;

namespace api.Services;

public interface IGameService
{
    Task<GameResponse> CreateAsync(CreateGameRequest request, CancellationToken ct = default);
    Task<GameResponse?> JoinAsync(Guid gameId, JoinGameRequest request, CancellationToken ct = default);
    Task<GameResponse?> MakeMoveAsync(Guid gameId, MakeMoveRequest request, CancellationToken ct = default);
    Task<GameResponse?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<IEnumerable<GameResponse>> GetActiveAsync(CancellationToken ct = default);
}

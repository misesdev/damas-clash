using api.DTOs.Games;
using api.Models;

namespace api.Services;

public interface IGameService
{
    Task<ServiceResult<GameResponse>> CreateAsync(Guid playerId, CancellationToken ct = default);
    Task<ServiceResult<GameResponse>> JoinAsync(Guid gameId, Guid playerId, CancellationToken ct = default);
    Task<ServiceResult<GameResponse>> MakeMoveAsync(Guid gameId, MakeMoveRequest request, Guid playerId, CancellationToken ct = default);
    Task<GameResponse?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<IEnumerable<GameResponse>> GetActiveAsync(CancellationToken ct = default);
}

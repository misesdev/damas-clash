using api.DTOs.Players;

namespace api.Services;

public interface IPlayerService
{
    Task<PlayerResponse?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<IEnumerable<PlayerResponse>> GetAllAsync(CancellationToken ct = default);
}

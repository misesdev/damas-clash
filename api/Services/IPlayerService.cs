using api.DTOs.Players;
using api.Models;

namespace api.Services;

public interface IPlayerService
{
    Task<PlayerResponse?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<IEnumerable<PlayerResponse>> GetAllAsync(CancellationToken ct = default);
    Task<ServiceResult<PlayerResponse>> UpdateUsernameAsync(Guid id, string username, CancellationToken ct = default);
    Task<ServiceResult<string>> UpdateAvatarAsync(Guid id, Stream stream, string fileName, string contentType, CancellationToken ct = default);
    Task<ServiceResult<PlayerResponse>> UpdateLightningAddressAsync(Guid id, string? address, CancellationToken ct = default);
}

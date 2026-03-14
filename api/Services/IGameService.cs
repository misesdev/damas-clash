using api.DTOs.Games;
using api.DTOs.Players;
using api.Models;
using api.Models.Enums;

namespace api.Services;

public interface IGameService
{
    Task<ServiceResult<GameResponse>> CreateAsync(Guid playerId, long betAmountSats = 0, CancellationToken ct = default);
    Task<ServiceResult<GameResponse>> JoinAsync(Guid gameId, Guid playerId, CancellationToken ct = default);
    Task<ServiceResult<GameResponse>> MakeMoveAsync(Guid gameId, MakeMoveRequest request, Guid playerId, CancellationToken ct = default);
    Task<GameResponse?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<IEnumerable<GameResponse>> GetActiveAsync(CancellationToken ct = default);
    Task<IEnumerable<GameResponse>> GetCompletedByPlayerAsync(Guid playerId, CancellationToken ct = default);
    Task<IEnumerable<MoveResponse>> GetMovesAsync(Guid gameId, CancellationToken ct = default);
    Task<PlayerStatsResponse> GetPlayerStatsAsync(Guid playerId, CancellationToken ct = default);
    Task<ServiceResult<bool>> CancelAsync(Guid gameId, Guid playerId, CancellationToken ct = default);
    Task<ServiceResult<GameResponse>> SkipTurnAsync(Guid gameId, Guid playerId, PieceColor? expectedCurrentTurn = null, CancellationToken ct = default);
    Task<ServiceResult<GameResponse>> ResignAsync(Guid gameId, Guid playerId, CancellationToken ct = default);
}

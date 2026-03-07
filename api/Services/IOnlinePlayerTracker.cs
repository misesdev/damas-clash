using api.DTOs.Players;

namespace api.Services;

/// <summary>
/// Thread-safe, in-memory tracker of connected lobby players.
/// Replaces the simple <see cref="ILobbyTracker"/> with full player presence data.
/// </summary>
public interface IOnlinePlayerTracker
{
    void Add(string connectionId, Guid playerId, string username, string? avatarUrl);
    int Remove(string connectionId);
    int Count { get; }
    IReadOnlyList<OnlinePlayerInfo> GetAll();
    void SetInGame(Guid playerId, Guid gameId);
    void SetOnline(Guid playerId);
    string? GetConnectionId(Guid playerId);
}

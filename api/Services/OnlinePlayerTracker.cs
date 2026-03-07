using System.Collections.Concurrent;
using api.DTOs.Players;

namespace api.Services;

public class OnlinePlayerTracker : IOnlinePlayerTracker
{
    private enum PlayerStatus { Online, InGame }

    private sealed record Entry(
        Guid PlayerId,
        string Username,
        string? AvatarUrl,
        PlayerStatus Status,
        Guid? GameId);

    // connectionId → player entry
    private readonly ConcurrentDictionary<string, Entry> _byConn = new();
    // playerId → connectionId (reverse index for O(1) lookup)
    private readonly ConcurrentDictionary<Guid, string> _playerToConn = new();

    public void Add(string connectionId, Guid playerId, string username, string? avatarUrl)
    {
        var entry = new Entry(playerId, username, avatarUrl, PlayerStatus.Online, null);
        _byConn[connectionId] = entry;
        _playerToConn[playerId] = connectionId;
    }

    public int Remove(string connectionId)
    {
        if (_byConn.TryRemove(connectionId, out var entry))
            _playerToConn.TryRemove(entry.PlayerId, out _);
        return _byConn.Count;
    }

    public int Count => _byConn.Count;

    public IReadOnlyList<OnlinePlayerInfo> GetAll() =>
        _byConn.Values
            .Select(e => new OnlinePlayerInfo(
                e.PlayerId,
                e.Username,
                e.AvatarUrl,
                e.Status == PlayerStatus.InGame ? "InGame" : "Online",
                e.GameId?.ToString()))
            .ToList();

    public void SetInGame(Guid playerId, Guid gameId)
    {
        if (!_playerToConn.TryGetValue(playerId, out var connId)) return;
        _byConn.AddOrUpdate(connId,
            _ => new Entry(playerId, string.Empty, null, PlayerStatus.InGame, gameId),
            (_, old) => old with { Status = PlayerStatus.InGame, GameId = gameId });
    }

    public void SetOnline(Guid playerId)
    {
        if (!_playerToConn.TryGetValue(playerId, out var connId)) return;
        _byConn.AddOrUpdate(connId,
            _ => new Entry(playerId, string.Empty, null, PlayerStatus.Online, null),
            (_, old) => old with { Status = PlayerStatus.Online, GameId = null });
    }

    public string? GetConnectionId(Guid playerId) =>
        _playerToConn.TryGetValue(playerId, out var connId) ? connId : null;
}

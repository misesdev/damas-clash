using System.Collections.Concurrent;

namespace api.Services;

public class GameWatcherService : IGameWatcherService
{
    // connectionId → gameId being watched
    private readonly ConcurrentDictionary<string, string> _connections = new();
    // gameId → watcher count
    private readonly ConcurrentDictionary<string, int> _counts = new();

    public int AddWatcher(string gameId, string connectionId)
    {
        _connections[connectionId] = gameId;
        return _counts.AddOrUpdate(gameId, 1, (_, c) => c + 1);
    }

    public int RemoveWatcher(string connectionId, out string? gameId)
    {
        if (!_connections.TryRemove(connectionId, out gameId))
            return 0;

        return _counts.AddOrUpdate(gameId, 0, (_, c) => Math.Max(0, c - 1));
    }

    public int GetCount(string gameId) =>
        _counts.GetValueOrDefault(gameId, 0);
}

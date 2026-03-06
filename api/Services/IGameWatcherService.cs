namespace api.Services;

public interface IGameWatcherService
{
    int AddWatcher(string gameId, string connectionId);
    int RemoveWatcher(string connectionId, out string? gameId);
    int GetCount(string gameId);
}

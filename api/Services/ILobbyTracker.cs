namespace api.Services;

public interface ILobbyTracker
{
    int Add(string connectionId);
    int Remove(string connectionId);
    int Count { get; }
}

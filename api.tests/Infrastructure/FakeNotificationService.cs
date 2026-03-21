using System.Collections.Concurrent;
using api.Services;

namespace api.tests.Infrastructure;

public class FakeNotificationService : INotificationService
{
    private readonly ConcurrentBag<(string Username, Guid SenderId, string Sender, string Text)> _mentions = new();
    private readonly ConcurrentBag<(string Username, Guid ReplierId, string Replier, string Text)> _replies = new();
    private readonly ConcurrentBag<(Guid CreatorId, string Creator, Guid GameId)> _gameCreated = new();
    private readonly ConcurrentBag<(Guid CreatorId, string Joiner, Guid GameId)> _playerJoined = new();
    private readonly ConcurrentBag<(string Username, bool IsNostr)> _newUsers = new();

    public IReadOnlyCollection<(string Username, Guid ReplierId, string Replier, string Text)> ReplyCalls =>
        _replies.ToArray();

    public IReadOnlyCollection<(Guid CreatorId, string Joiner, Guid GameId)> PlayerJoinedCalls =>
        _playerJoined.ToArray();

    public IReadOnlyCollection<(string Username, bool IsNostr)> NewUserCalls =>
        _newUsers.ToArray();

    public Task SendMentionNotificationAsync(
        string mentionedUsername, Guid senderPlayerId, string senderUsername, string messageText)
    {
        _mentions.Add((mentionedUsername, senderPlayerId, senderUsername, messageText));
        return Task.CompletedTask;
    }

    public Task SendReplyNotificationAsync(
        string repliedToUsername, Guid replierPlayerId, string replierUsername, string messageText)
    {
        _replies.Add((repliedToUsername, replierPlayerId, replierUsername, messageText));
        return Task.CompletedTask;
    }

    public Task SendGameCreatedNotificationAsync(Guid creatorPlayerId, string creatorUsername, Guid gameId)
    {
        _gameCreated.Add((creatorPlayerId, creatorUsername, gameId));
        return Task.CompletedTask;
    }

    public Task SendPlayerJoinedNotificationAsync(Guid creatorPlayerId, string joinerUsername, Guid gameId)
    {
        _playerJoined.Add((creatorPlayerId, joinerUsername, gameId));
        return Task.CompletedTask;
    }

    public Task SendNewUserNotificationAsync(string newUsername, bool isNostr)
    {
        _newUsers.Add((newUsername, isNostr));
        return Task.CompletedTask;
    }
}

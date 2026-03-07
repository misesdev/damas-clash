using api.Services;

namespace api.tests.Services;

public class OnlinePlayerTrackerTests
{
    private static OnlinePlayerTracker Make() => new();

    [Fact]
    public void Add_IncreasesCount()
    {
        var tracker = Make();
        tracker.Add("conn1", Guid.NewGuid(), "user1", null);
        Assert.Equal(1, tracker.Count);
    }

    [Fact]
    public void Remove_DecreasesCount()
    {
        var tracker = Make();
        tracker.Add("conn1", Guid.NewGuid(), "user1", null);
        tracker.Remove("conn1");
        Assert.Equal(0, tracker.Count);
    }

    [Fact]
    public void Remove_UnknownConnection_DoesNotThrow()
    {
        var tracker = Make();
        var count = tracker.Remove("unknown");
        Assert.Equal(0, count);
    }

    [Fact]
    public void GetAll_ReturnsOnlineStatus()
    {
        var tracker = Make();
        var id = Guid.NewGuid();
        tracker.Add("conn1", id, "alice", "http://avatar");

        var all = tracker.GetAll();

        Assert.Single(all);
        Assert.Equal("alice", all[0].Username);
        Assert.Equal("Online", all[0].Status);
        Assert.Equal("http://avatar", all[0].AvatarUrl);
        Assert.Null(all[0].GameId);
    }

    [Fact]
    public void SetInGame_UpdatesStatusAndGameId()
    {
        var tracker = Make();
        var playerId = Guid.NewGuid();
        var gameId = Guid.NewGuid();
        tracker.Add("conn1", playerId, "alice", null);

        tracker.SetInGame(playerId, gameId);

        var all = tracker.GetAll();
        Assert.Equal("InGame", all[0].Status);
        Assert.Equal(gameId.ToString(), all[0].GameId);
    }

    [Fact]
    public void SetOnline_AfterInGame_RestoresStatus()
    {
        var tracker = Make();
        var playerId = Guid.NewGuid();
        tracker.Add("conn1", playerId, "alice", null);
        tracker.SetInGame(playerId, Guid.NewGuid());

        tracker.SetOnline(playerId);

        var all = tracker.GetAll();
        Assert.Equal("Online", all[0].Status);
        Assert.Null(all[0].GameId);
    }

    [Fact]
    public void SetInGame_UnknownPlayer_DoesNotThrow()
    {
        var tracker = Make();
        tracker.SetInGame(Guid.NewGuid(), Guid.NewGuid()); // should silently no-op
    }

    [Fact]
    public void GetConnectionId_ReturnsCorrectConnectionId()
    {
        var tracker = Make();
        var playerId = Guid.NewGuid();
        tracker.Add("conn-abc", playerId, "alice", null);

        Assert.Equal("conn-abc", tracker.GetConnectionId(playerId));
    }

    [Fact]
    public void GetConnectionId_UnknownPlayer_ReturnsNull()
    {
        var tracker = Make();
        Assert.Null(tracker.GetConnectionId(Guid.NewGuid()));
    }

    [Fact]
    public void Remove_ClearsReverseIndex()
    {
        var tracker = Make();
        var playerId = Guid.NewGuid();
        tracker.Add("conn1", playerId, "alice", null);
        tracker.Remove("conn1");

        Assert.Null(tracker.GetConnectionId(playerId));
    }

    [Fact]
    public void GetAll_MultiplePlayers_ReturnsAll()
    {
        var tracker = Make();
        tracker.Add("c1", Guid.NewGuid(), "alice", null);
        tracker.Add("c2", Guid.NewGuid(), "bob", null);
        tracker.Add("c3", Guid.NewGuid(), "carol", null);

        Assert.Equal(3, tracker.GetAll().Count);
    }
}

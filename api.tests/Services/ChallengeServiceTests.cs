using api.Services;

namespace api.tests.Services;

public class ChallengeServiceTests
{
    private static ChallengeService Make() => new();

    [Fact]
    public void Send_ThenAccept_ReturnsEntry()
    {
        var svc = Make();
        var from = Guid.NewGuid();
        var to = Guid.NewGuid();

        svc.Send(from, "alice", to);
        var entry = svc.Accept(from, to);

        Assert.NotNull(entry);
        Assert.Equal(from, entry!.FromPlayerId);
        Assert.Equal("alice", entry.FromUsername);
        Assert.Equal(to, entry.ToPlayerId);
    }

    [Fact]
    public void Accept_WithoutPriorSend_ReturnsNull()
    {
        var svc = Make();
        Assert.Null(svc.Accept(Guid.NewGuid(), Guid.NewGuid()));
    }

    [Fact]
    public void Accept_Twice_SecondReturnsNull()
    {
        var svc = Make();
        var from = Guid.NewGuid();
        var to = Guid.NewGuid();
        svc.Send(from, "alice", to);
        svc.Accept(from, to);

        Assert.Null(svc.Accept(from, to));
    }

    [Fact]
    public void Decline_ReturnsTrueAndFromUsername()
    {
        var svc = Make();
        var from = Guid.NewGuid();
        var to = Guid.NewGuid();
        svc.Send(from, "alice", to);

        var result = svc.Decline(from, to, out var username);

        Assert.True(result);
        Assert.Equal("alice", username);
    }

    [Fact]
    public void Decline_WithoutSend_ReturnsFalse()
    {
        var svc = Make();
        var result = svc.Decline(Guid.NewGuid(), Guid.NewGuid(), out var username);
        Assert.False(result);
        Assert.Null(username);
    }

    [Fact]
    public void Cancel_RemovesPendingChallenge()
    {
        var svc = Make();
        var from = Guid.NewGuid();
        var to = Guid.NewGuid();
        svc.Send(from, "alice", to);

        svc.Cancel(from, to);

        Assert.Null(svc.Accept(from, to));
    }

    [Fact]
    public void HasPending_AfterSend_ReturnsTrue()
    {
        var svc = Make();
        var from = Guid.NewGuid();
        var to = Guid.NewGuid();
        svc.Send(from, "alice", to);

        Assert.True(svc.HasPending(from, to));
    }

    [Fact]
    public void HasPending_AfterAccept_ReturnsFalse()
    {
        var svc = Make();
        var from = Guid.NewGuid();
        var to = Guid.NewGuid();
        svc.Send(from, "alice", to);
        svc.Accept(from, to);

        Assert.False(svc.HasPending(from, to));
    }

    [Fact]
    public void Send_OverwritesPreviousChallenge()
    {
        var svc = Make();
        var from = Guid.NewGuid();
        var to = Guid.NewGuid();
        svc.Send(from, "old_username", to);
        svc.Send(from, "alice", to);

        var entry = svc.Accept(from, to);
        Assert.Equal("alice", entry!.FromUsername);
    }
}

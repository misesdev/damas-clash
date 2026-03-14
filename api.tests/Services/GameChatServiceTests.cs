using api.Services;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

namespace api.tests.Services;

public class GameChatServiceTests
{
    private static GameChatService CreateService()
    {
        var cache = new MemoryDistributedCache(Options.Create(new MemoryDistributedCacheOptions()));
        return new GameChatService(cache);
    }

    private static readonly Guid Player1 = Guid.NewGuid();
    private static readonly Guid Player2 = Guid.NewGuid();

    // ── GetHistoryAsync ───────────────────────────────────────────────────────

    [Fact]
    public async Task GetHistory_EmptyCache_ReturnsEmptyList()
    {
        var service = CreateService();
        var result = await service.GetHistoryAsync("game-1");
        Assert.Empty(result);
    }

    [Fact]
    public async Task GetHistory_DifferentGames_AreIsolated()
    {
        var service = CreateService();

        await service.AddMessageAsync("game-A", Player1, "alice", null, "Hello A");
        await service.AddMessageAsync("game-B", Player2, "bob", null, "Hello B");

        var historyA = await service.GetHistoryAsync("game-A");
        var historyB = await service.GetHistoryAsync("game-B");

        Assert.Single(historyA);
        Assert.Equal("Hello A", historyA[0].Text);

        Assert.Single(historyB);
        Assert.Equal("Hello B", historyB[0].Text);
    }

    // ── AddMessageAsync ───────────────────────────────────────────────────────

    [Fact]
    public async Task AddMessage_ReturnsMessageWithCorrectFields()
    {
        var service = CreateService();
        var gameId = "game-1";

        var msg = await service.AddMessageAsync(gameId, Player1, "alice", "http://avatar", "Hi!");

        Assert.NotEmpty(msg.Id);
        Assert.Equal(Player1.ToString(), msg.PlayerId);
        Assert.Equal("alice", msg.Username);
        Assert.Equal("http://avatar", msg.AvatarUrl);
        Assert.Equal("Hi!", msg.Text);
        Assert.True(msg.SentAt <= DateTimeOffset.UtcNow);
    }

    [Fact]
    public async Task AddMessage_IsPersisted_InHistory()
    {
        var service = CreateService();
        var gameId = "game-1";

        await service.AddMessageAsync(gameId, Player1, "alice", null, "First");
        await service.AddMessageAsync(gameId, Player2, "bob", null, "Second");

        var history = await service.GetHistoryAsync(gameId);
        Assert.Equal(2, history.Count);
        Assert.Equal("First", history[0].Text);
        Assert.Equal("Second", history[1].Text);
    }

    [Fact]
    public async Task AddMessage_ExceedsMaxMessages_KeepsLatest50()
    {
        var service = CreateService();
        var gameId = "game-overflow";

        for (var i = 1; i <= 55; i++)
            await service.AddMessageAsync(gameId, Player1, "alice", null, $"msg {i}");

        var history = await service.GetHistoryAsync(gameId);
        Assert.Equal(50, history.Count);
        Assert.Equal("msg 6", history[0].Text);   // oldest kept
        Assert.Equal("msg 55", history[49].Text); // newest
    }

    [Fact]
    public async Task AddMessage_TextTruncatedAt500Chars()
    {
        var service = CreateService();
        var longText = new string('x', 600);

        var msg = await service.AddMessageAsync("game-1", Player1, "alice", null, longText);

        Assert.Equal(500, msg.Text.Length);
    }

    [Fact]
    public async Task AddMessage_Exactly500Chars_NotTruncated()
    {
        var service = CreateService();
        var text = new string('a', 500);

        var msg = await service.AddMessageAsync("game-1", Player1, "alice", null, text);

        Assert.Equal(500, msg.Text.Length);
    }

    [Fact]
    public async Task AddMessage_AvatarUrl_Nullable()
    {
        var service = CreateService();

        var msg = await service.AddMessageAsync("game-1", Player1, "alice", null, "no avatar");

        Assert.Null(msg.AvatarUrl);
    }

    [Fact]
    public async Task AddMessage_UniqueIds_PerMessage()
    {
        var service = CreateService();
        var gameId = "game-1";

        var m1 = await service.AddMessageAsync(gameId, Player1, "alice", null, "A");
        var m2 = await service.AddMessageAsync(gameId, Player2, "bob", null, "B");

        Assert.NotEqual(m1.Id, m2.Id);
    }
}

using api.Services;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

namespace api.tests.Services;

public class ChatServiceTests
{
    private static ChatService CreateService()
    {
        var cache = new MemoryDistributedCache(Options.Create(new MemoryDistributedCacheOptions()));
        return new ChatService(cache);
    }

    private static readonly Guid Player1 = Guid.NewGuid();
    private static readonly Guid Player2 = Guid.NewGuid();

    // ── GetHistoryAsync ───────────────────────────────────────────────────────

    [Fact]
    public async Task GetHistory_EmptyCache_ReturnsEmptyList()
    {
        var service = CreateService();
        var result = await service.GetHistoryAsync();
        Assert.Empty(result);
    }

    // ── AddMessageAsync ───────────────────────────────────────────────────────

    [Fact]
    public async Task AddMessage_ReturnsMessageWithCorrectFields()
    {
        var service = CreateService();

        var msg = await service.AddMessageAsync(Player1, "alice", "http://avatar", "Hi!");

        Assert.NotEmpty(msg.Id);
        Assert.Equal(Player1.ToString(), msg.PlayerId);
        Assert.Equal("alice", msg.Username);
        Assert.Equal("http://avatar", msg.AvatarUrl);
        Assert.Equal("Hi!", msg.Text);
        Assert.True(msg.SentAt <= DateTimeOffset.UtcNow);
        Assert.Null(msg.EditedAt);
        Assert.False(msg.IsDeleted);
    }

    [Fact]
    public async Task AddMessage_IsPersisted_InHistory()
    {
        var service = CreateService();

        await service.AddMessageAsync(Player1, "alice", null, "First");
        await service.AddMessageAsync(Player2, "bob", null, "Second");

        var history = await service.GetHistoryAsync();
        Assert.Equal(2, history.Count);
        Assert.Equal("First", history[0].Text);
        Assert.Equal("Second", history[1].Text);
    }

    [Fact]
    public async Task AddMessage_ExceedsMaxMessages_KeepsLatest50()
    {
        var service = CreateService();

        for (var i = 1; i <= 55; i++)
            await service.AddMessageAsync(Player1, "alice", null, $"msg {i}");

        var history = await service.GetHistoryAsync();
        Assert.Equal(50, history.Count);
        Assert.Equal("msg 6", history[0].Text);
        Assert.Equal("msg 55", history[49].Text);
    }

    [Fact]
    public async Task AddMessage_UniqueIds_PerMessage()
    {
        var service = CreateService();

        var m1 = await service.AddMessageAsync(Player1, "alice", null, "A");
        var m2 = await service.AddMessageAsync(Player2, "bob", null, "B");

        Assert.NotEqual(m1.Id, m2.Id);
    }

    // ── EditMessageAsync ──────────────────────────────────────────────────────

    [Fact]
    public async Task EditMessage_ByOwner_UpdatesTextAndSetsEditedAt()
    {
        var service = CreateService();
        var msg = await service.AddMessageAsync(Player1, "alice", null, "Original");

        var updated = await service.EditMessageAsync(Player1, msg.Id, "Edited text");

        Assert.NotNull(updated);
        Assert.Equal("Edited text", updated!.Text);
        Assert.NotNull(updated.EditedAt);
        Assert.False(updated.IsDeleted);

        var history = await service.GetHistoryAsync();
        Assert.Equal("Edited text", history[0].Text);
    }

    [Fact]
    public async Task EditMessage_ByNonOwner_ReturnsNull()
    {
        var service = CreateService();
        var msg = await service.AddMessageAsync(Player1, "alice", null, "Original");

        var result = await service.EditMessageAsync(Player2, msg.Id, "Hacked");

        Assert.Null(result);
        var history = await service.GetHistoryAsync();
        Assert.Equal("Original", history[0].Text);
    }

    [Fact]
    public async Task EditMessage_NonExistentId_ReturnsNull()
    {
        var service = CreateService();
        var result = await service.EditMessageAsync(Player1, "nonexistent-id", "Text");
        Assert.Null(result);
    }

    [Fact]
    public async Task EditMessage_AlreadyDeleted_ReturnsNull()
    {
        var service = CreateService();
        var msg = await service.AddMessageAsync(Player1, "alice", null, "Original");
        await service.DeleteMessageAsync(Player1, msg.Id);

        var result = await service.EditMessageAsync(Player1, msg.Id, "Try to edit deleted");

        Assert.Null(result);
    }

    [Fact]
    public async Task EditMessage_PreservesOtherFields()
    {
        var service = CreateService();
        var msg = await service.AddMessageAsync(Player1, "alice", "http://avatar", "Original");

        var updated = await service.EditMessageAsync(Player1, msg.Id, "Edited");

        Assert.NotNull(updated);
        Assert.Equal(msg.Id, updated!.Id);
        Assert.Equal(msg.PlayerId, updated.PlayerId);
        Assert.Equal(msg.Username, updated.Username);
        Assert.Equal(msg.AvatarUrl, updated.AvatarUrl);
        Assert.Equal(msg.SentAt, updated.SentAt);
    }

    // ── DeleteMessageAsync ────────────────────────────────────────────────────

    [Fact]
    public async Task DeleteMessage_ByOwner_SetsIsDeletedAndClearsText()
    {
        var service = CreateService();
        var msg = await service.AddMessageAsync(Player1, "alice", null, "Hello");

        var deleted = await service.DeleteMessageAsync(Player1, msg.Id);

        Assert.NotNull(deleted);
        Assert.True(deleted!.IsDeleted);
        Assert.Equal(string.Empty, deleted.Text);

        var history = await service.GetHistoryAsync();
        Assert.True(history[0].IsDeleted);
    }

    [Fact]
    public async Task DeleteMessage_ByNonOwner_ReturnsNull()
    {
        var service = CreateService();
        var msg = await service.AddMessageAsync(Player1, "alice", null, "Hello");

        var result = await service.DeleteMessageAsync(Player2, msg.Id);

        Assert.Null(result);
        var history = await service.GetHistoryAsync();
        Assert.False(history[0].IsDeleted);
    }

    [Fact]
    public async Task DeleteMessage_NonExistentId_ReturnsNull()
    {
        var service = CreateService();
        var result = await service.DeleteMessageAsync(Player1, "nonexistent-id");
        Assert.Null(result);
    }

    [Fact]
    public async Task DeleteMessage_AlreadyDeleted_ReturnsNull()
    {
        var service = CreateService();
        var msg = await service.AddMessageAsync(Player1, "alice", null, "Hello");
        await service.DeleteMessageAsync(Player1, msg.Id);

        var result = await service.DeleteMessageAsync(Player1, msg.Id);

        Assert.Null(result);
    }

    [Fact]
    public async Task DeleteMessage_OnlyAffectsTargetMessage()
    {
        var service = CreateService();
        var m1 = await service.AddMessageAsync(Player1, "alice", null, "First");
        var m2 = await service.AddMessageAsync(Player2, "bob", null, "Second");

        await service.DeleteMessageAsync(Player1, m1.Id);

        var history = await service.GetHistoryAsync();
        Assert.True(history[0].IsDeleted);
        Assert.False(history[1].IsDeleted);
        Assert.Equal("Second", history[1].Text);
    }

    // ── History preserves deleted/edited state ────────────────────────────────

    [Fact]
    public async Task GetHistory_IncludesDeletedMessages_AsTombstones()
    {
        var service = CreateService();
        await service.AddMessageAsync(Player1, "alice", null, "Hi");
        var m2 = await service.AddMessageAsync(Player2, "bob", null, "Bye");
        await service.DeleteMessageAsync(Player2, m2.Id);

        var history = await service.GetHistoryAsync();
        Assert.Equal(2, history.Count);
        Assert.False(history[0].IsDeleted);
        Assert.True(history[1].IsDeleted);
    }
}

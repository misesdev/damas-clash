using System.Text.Json;
using api.DTOs.Chat;
using Microsoft.Extensions.Caching.Distributed;

namespace api.Services;

public class ChatService(IDistributedCache cache) : IChatService
{
    private const string CacheKey = "chat:global";
    private const int MaxMessages = 50;
    private static readonly DistributedCacheEntryOptions CacheOptions = new()
    {
        AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(7),
    };

    public async Task<IReadOnlyList<ChatMessage>> GetHistoryAsync(CancellationToken ct = default)
        => await LoadAsync(ct);

    public async Task<ChatMessage> AddMessageAsync(
        Guid playerId, string username, string? avatarUrl, string text, string? replyToId = null, CancellationToken ct = default)
    {
        var messages = await LoadAsync(ct);

        ChatMessageReply? replyTo = null;
        if (replyToId is not null)
        {
            var original = messages.FirstOrDefault(m => m.Id == replyToId);
            if (original is not null)
                replyTo = new ChatMessageReply(original.Id, original.Username,
                    original.IsDeleted ? string.Empty : original.Text);
        }

        var message = new ChatMessage(
            Guid.NewGuid().ToString(),
            playerId.ToString(),
            username,
            avatarUrl,
            text,
            DateTimeOffset.UtcNow,
            ReplyTo: replyTo);

        messages.Add(message);
        if (messages.Count > MaxMessages)
            messages = messages[^MaxMessages..];

        await SaveAsync(messages, ct);
        return message;
    }

    public async Task<ChatMessage?> EditMessageAsync(
        Guid requesterId, string messageId, string newText, CancellationToken ct = default)
    {
        var messages = await LoadAsync(ct);
        var index = messages.FindIndex(m =>
            m.Id == messageId &&
            m.PlayerId == requesterId.ToString() &&
            !m.IsDeleted);

        if (index < 0) return null;

        var updated = messages[index] with { Text = newText, EditedAt = DateTimeOffset.UtcNow };
        messages[index] = updated;
        await SaveAsync(messages, ct);
        return updated;
    }

    public async Task<ChatMessage?> DeleteMessageAsync(
        Guid requesterId, string messageId, CancellationToken ct = default)
    {
        var messages = await LoadAsync(ct);
        var index = messages.FindIndex(m =>
            m.Id == messageId &&
            m.PlayerId == requesterId.ToString() &&
            !m.IsDeleted);

        if (index < 0) return null;

        var deleted = messages[index] with { Text = string.Empty, IsDeleted = true };
        messages[index] = deleted;
        await SaveAsync(messages, ct);
        return deleted;
    }

    private async Task<List<ChatMessage>> LoadAsync(CancellationToken ct)
    {
        var raw = await cache.GetStringAsync(CacheKey, ct);
        return string.IsNullOrEmpty(raw)
            ? []
            : JsonSerializer.Deserialize<List<ChatMessage>>(raw) ?? [];
    }

    private Task SaveAsync(List<ChatMessage> messages, CancellationToken ct) =>
        cache.SetStringAsync(CacheKey, JsonSerializer.Serialize(messages), CacheOptions, ct);
}

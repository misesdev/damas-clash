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
    {
        var raw = await cache.GetStringAsync(CacheKey, ct);
        if (string.IsNullOrEmpty(raw)) return [];
        return JsonSerializer.Deserialize<List<ChatMessage>>(raw) ?? [];
    }

    public async Task<ChatMessage> AddMessageAsync(
        Guid playerId, string username, string? avatarUrl, string text, CancellationToken ct = default)
    {
        var message = new ChatMessage(
            Guid.NewGuid().ToString(),
            playerId.ToString(),
            username,
            avatarUrl,
            text,
            DateTimeOffset.UtcNow);

        // Read-modify-write (acceptable for chat; occasional race is non-critical)
        var raw = await cache.GetStringAsync(CacheKey, ct);
        var messages = string.IsNullOrEmpty(raw)
            ? []
            : JsonSerializer.Deserialize<List<ChatMessage>>(raw) ?? [];

        messages.Add(message);
        if (messages.Count > MaxMessages)
            messages = messages[^MaxMessages..];

        await cache.SetStringAsync(CacheKey, JsonSerializer.Serialize(messages), CacheOptions, ct);
        return message;
    }
}

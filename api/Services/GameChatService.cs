using System.Text.Json;
using api.DTOs.Chat;
using Microsoft.Extensions.Caching.Distributed;

namespace api.Services;

public class GameChatService(IDistributedCache cache) : IGameChatService
{
    private const int MaxMessages = 50;
    private const int MaxTextLength = 500;
    private static readonly DistributedCacheEntryOptions CacheOptions = new()
    {
        AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(24),
    };

    private static string Key(string gameId) => $"gamechat:{gameId}";

    public async Task<IReadOnlyList<ChatMessage>> GetHistoryAsync(string gameId, CancellationToken ct = default)
    {
        var raw = await cache.GetStringAsync(Key(gameId), ct);
        if (string.IsNullOrEmpty(raw)) return [];
        return JsonSerializer.Deserialize<List<ChatMessage>>(raw) ?? [];
    }

    public async Task<ChatMessage> AddMessageAsync(
        string gameId, Guid playerId, string username, string? avatarUrl, string text, CancellationToken ct = default)
    {
        var trimmed = text.Length > MaxTextLength ? text[..MaxTextLength] : text;

        var message = new ChatMessage(
            Guid.NewGuid().ToString(),
            playerId.ToString(),
            username,
            avatarUrl,
            trimmed,
            DateTimeOffset.UtcNow);

        // Read-modify-write (acceptable for chat; occasional race is non-critical)
        var raw = await cache.GetStringAsync(Key(gameId), ct);
        var messages = string.IsNullOrEmpty(raw)
            ? []
            : JsonSerializer.Deserialize<List<ChatMessage>>(raw) ?? [];

        messages.Add(message);
        if (messages.Count > MaxMessages)
            messages = messages[^MaxMessages..];

        await cache.SetStringAsync(Key(gameId), JsonSerializer.Serialize(messages), CacheOptions, ct);
        return message;
    }
}

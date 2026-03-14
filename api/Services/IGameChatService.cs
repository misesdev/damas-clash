using api.DTOs.Chat;

namespace api.Services;

public interface IGameChatService
{
    Task<IReadOnlyList<ChatMessage>> GetHistoryAsync(string gameId, CancellationToken ct = default);
    Task<ChatMessage> AddMessageAsync(string gameId, Guid playerId, string username, string? avatarUrl, string text, CancellationToken ct = default);
}

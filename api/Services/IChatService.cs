using api.DTOs.Chat;

namespace api.Services;

public interface IChatService
{
    Task<IReadOnlyList<ChatMessage>> GetHistoryAsync(CancellationToken ct = default);
    Task<ChatMessage> AddMessageAsync(Guid playerId, string username, string? avatarUrl, string text, CancellationToken ct = default);
}

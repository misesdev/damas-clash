using api.DTOs.Chat;

namespace api.Services;

public interface IChatService
{
    Task<IReadOnlyList<ChatMessage>> GetHistoryAsync(CancellationToken ct = default);
    Task<ChatMessage> AddMessageAsync(Guid playerId, string username, string? avatarUrl, string text, string? replyToId = null, CancellationToken ct = default);
    Task<ChatMessage?> EditMessageAsync(Guid requesterId, string messageId, string newText, CancellationToken ct = default);
    Task<ChatMessage?> DeleteMessageAsync(Guid requesterId, string messageId, CancellationToken ct = default);
}

namespace api.DTOs.Chat;

public record ChatMessage(
    string Id,
    string PlayerId,
    string Username,
    string? AvatarUrl,
    string Text,
    DateTimeOffset SentAt);

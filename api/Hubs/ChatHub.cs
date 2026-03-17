using System.Security.Claims;
using System.Text.RegularExpressions;
using api.Data;
using api.Services;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace api.Hubs;

public class ChatHub(
    IChatService chatService,
    DamasDbContext db,
    INotificationService notificationService) : Hub
{
    private const int MaxTextLength = 500;

    private Guid? CallerId =>
        Guid.TryParse(Context.User?.FindFirstValue(ClaimTypes.NameIdentifier), out var id)
            ? id : null;

    private string CallerUsername =>
        Context.User?.FindFirstValue("username") ?? "Unknown";

    public override async Task OnConnectedAsync()
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, "chat");
        var history = await chatService.GetHistoryAsync();
        await Clients.Caller.SendAsync("ChatHistory", history);
        await base.OnConnectedAsync();
    }

    public async Task SendMessage(string text, string? replyToId = null)
    {
        var callerId = CallerId;
        if (callerId is null) return;

        var trimmed = text.Trim();
        if (string.IsNullOrEmpty(trimmed)) return;
        if (trimmed.Length > MaxTextLength)
            trimmed = trimmed[..MaxTextLength];

        var avatarUrl = await db.Players
            .Where(p => p.Id == callerId.Value)
            .Select(p => p.AvatarUrl)
            .FirstOrDefaultAsync();

        var message = await chatService.AddMessageAsync(
            callerId.Value, CallerUsername, avatarUrl, trimmed, replyToId);

        await Clients.Group("chat").SendAsync("NewMessage", message);

        // Send FCM push notifications to each distinct mentioned player
        // (fire-and-forget — do not await so the hub response is not delayed)
        _ = SendMentionNotificationsAsync(trimmed, CallerUsername);
    }

    private async Task SendMentionNotificationsAsync(string text, string senderUsername)
    {
        var mentioned = ExtractMentions(text);
        foreach (var username in mentioned)
        {
            if (!string.Equals(username, senderUsername, StringComparison.OrdinalIgnoreCase))
                await notificationService.SendMentionNotificationAsync(username, senderUsername, text);
        }
    }

    // Matches @[username with spaces] (group 1) or @word (group 2)
    private static readonly Regex MentionRegex =
        new(@"@\[([^\]]+)\]|@(\w+)", RegexOptions.Compiled);

    private static IEnumerable<string> ExtractMentions(string text) =>
        MentionRegex.Matches(text)
            .Select(m => m.Groups[1].Success ? m.Groups[1].Value : m.Groups[2].Value)
            .Distinct(StringComparer.OrdinalIgnoreCase);

    public async Task EditMessage(string messageId, string newText)
    {
        var callerId = CallerId;
        if (callerId is null) return;

        var trimmed = newText.Trim();
        if (string.IsNullOrEmpty(trimmed)) return;
        if (trimmed.Length > MaxTextLength)
            trimmed = trimmed[..MaxTextLength];

        var updated = await chatService.EditMessageAsync(callerId.Value, messageId, trimmed);
        if (updated is null) return;

        await Clients.Group("chat").SendAsync("MessageEdited", updated);
    }

    public async Task DeleteMessage(string messageId)
    {
        var callerId = CallerId;
        if (callerId is null) return;

        var deleted = await chatService.DeleteMessageAsync(callerId.Value, messageId);
        if (deleted is null) return;

        await Clients.Group("chat").SendAsync("MessageDeleted", messageId);
    }
}

using System.Security.Claims;
using api.Data;
using api.Services;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace api.Hubs;

public class ChatHub(IChatService chatService, DamasDbContext db) : Hub
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

    public async Task SendMessage(string text)
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
            callerId.Value, CallerUsername, avatarUrl, trimmed);

        await Clients.Group("chat").SendAsync("NewMessage", message);
    }
}

using System.Security.Claims;
using api.Data;
using api.Services;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace api.Hubs;

public class GameHub(
    IGameCacheService cache,
    IGameService gameService,
    IGameWatcherService watchers,
    IOnlinePlayerTracker tracker,
    IChallengeService challenges,
    IGameChatService gameChat,
    DamasDbContext db) : Hub
{
    // ── Helpers ──────────────────────────────────────────────────────────────────

    private Guid? CallerId =>
        Guid.TryParse(Context.User?.FindFirstValue(ClaimTypes.NameIdentifier), out var id)
            ? id : null;

    private string CallerUsername =>
        Context.User?.FindFirstValue("username") ?? "Unknown";

    private async Task BroadcastOnlinePlayersAsync() =>
        await Clients.Group("lobby").SendAsync("OnlinePlayersUpdated", tracker.GetAll());

    // ── Game watching ─────────────────────────────────────────────────────────────

    /// <summary>Called by players — joins the game room without counting as a spectator.</summary>
    public async Task JoinGameRoom(string gameId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, gameId);

        // Track which game this connection is in (used by SendGameMessage)
        Context.Items["gameId"] = gameId;

        if (Guid.TryParse(gameId, out var id))
        {
            var state = await cache.GetBoardStateAsync(id);
            if (state is not null)
                await Clients.Caller.SendAsync("GameState", state);
        }

        var history = await gameChat.GetHistoryAsync(gameId);
        if (history.Count > 0)
            await Clients.Caller.SendAsync("GameChatHistory", history);
    }

    // ── Game Chat ─────────────────────────────────────────────────────────────────

    /// <summary>Broadcast a chat message to everyone in the game room.</summary>
    public async Task SendGameMessage(string text)
    {
        var callerId = CallerId;
        if (callerId is null) return;

        var trimmed = text.Trim();
        if (string.IsNullOrEmpty(trimmed)) return;

        var gameId = Context.Items["gameId"] as string;
        if (string.IsNullOrEmpty(gameId)) return;

        var avatarUrl = await db.Players
            .Where(p => p.Id == callerId.Value)
            .Select(p => p.AvatarUrl)
            .FirstOrDefaultAsync();

        var message = await gameChat.AddMessageAsync(
            gameId, callerId.Value, CallerUsername, avatarUrl, trimmed);

        await Clients.Group(gameId).SendAsync("GameMessage", message);
    }

    /// <summary>Called by spectators — joins the game room and increments the watcher count.</summary>
    public async Task WatchGame(string gameId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, gameId);

        var count = watchers.AddWatcher(gameId, Context.ConnectionId);
        await Clients.Group(gameId).SendAsync("WatchersUpdated", count);

        if (Guid.TryParse(gameId, out var id))
        {
            var state = await cache.GetBoardStateAsync(id);
            if (state is not null)
                await Clients.Caller.SendAsync("GameState", state);
        }
    }

    public async Task StopWatching(string gameId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, gameId);

        var count = watchers.RemoveWatcher(Context.ConnectionId, out _);
        await Clients.Group(gameId).SendAsync("WatchersUpdated", count);
    }

    // ── Lobby ─────────────────────────────────────────────────────────────────────

    public async Task JoinLobby()
    {
        var playerId = CallerId;
        if (playerId is null)
            throw new HubException("unauthorized");

        await Groups.AddToGroupAsync(Context.ConnectionId, "lobby");

        var avatarUrl = await db.Players
            .Where(p => p.Id == playerId.Value)
            .Select(p => p.AvatarUrl)
            .FirstOrDefaultAsync();

        tracker.Add(Context.ConnectionId, playerId.Value, CallerUsername, avatarUrl);

        await BroadcastOnlinePlayersAsync();

        var cached = await cache.GetGameListAsync();
        if (cached is not null)
            await Clients.Caller.SendAsync("GameListUpdated", cached);
        else
        {
            var games = await gameService.GetActiveAsync();
            await Clients.Caller.SendAsync("GameListUpdated", games);
        }
    }

    public async Task LeaveLobby()
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, "lobby");
        tracker.Remove(Context.ConnectionId);
        await BroadcastOnlinePlayersAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var watcherCount = watchers.RemoveWatcher(Context.ConnectionId, out var gameId);
        if (gameId is not null)
            await Clients.Group(gameId).SendAsync("WatchersUpdated", watcherCount);

        tracker.Remove(Context.ConnectionId);
        await BroadcastOnlinePlayersAsync();

        await base.OnDisconnectedAsync(exception);
    }

    // ── Challenge ─────────────────────────────────────────────────────────────────

    /// <summary>Send a match challenge to another online player.</summary>
    public async Task ChallengePlayer(string targetPlayerIdStr)
    {
        var callerId = CallerId;
        if (callerId is null || !Guid.TryParse(targetPlayerIdStr, out var targetId)) return;
        if (targetId == callerId.Value) return;

        var targetConnId = tracker.GetConnectionId(targetId);
        if (targetConnId is null)
        {
            await Clients.Caller.SendAsync("ChallengeError", "player_offline");
            return;
        }

        challenges.Send(callerId.Value, CallerUsername, targetId);
        await Clients.Client(targetConnId).SendAsync("ChallengeReceived", callerId.Value.ToString(), CallerUsername);
    }

    /// <summary>Accept a pending challenge — creates the game and notifies both players via GameStarted.</summary>
    public async Task AcceptChallenge(string challengerIdStr)
    {
        var acceptorId = CallerId;
        if (acceptorId is null || !Guid.TryParse(challengerIdStr, out var challengerId)) return;

        var challenge = challenges.Accept(challengerId, acceptorId.Value);
        if (challenge is null)
        {
            await Clients.Caller.SendAsync("ChallengeError", "challenge_expired");
            return;
        }

        // Create game owned by the challenger (black pieces)
        var createResult = await gameService.CreateAsync(challengerId);
        if (!createResult.IsSuccess)
        {
            await Clients.Caller.SendAsync("ChallengeError", "create_failed");
            return;
        }

        var gameIdStr = createResult.Value!.Id.ToString();

        // Add both connections to game group BEFORE joining so GameStarted reaches them
        var challengerConnId = tracker.GetConnectionId(challengerId);
        if (challengerConnId is not null)
            await Groups.AddToGroupAsync(challengerConnId, gameIdStr);
        await Groups.AddToGroupAsync(Context.ConnectionId, gameIdStr);

        // Join as acceptor (white pieces) — broadcasts GameStarted to the game group
        await gameService.JoinAsync(createResult.Value!.Id, acceptorId.Value);

        // Refresh online player list (both now marked InGame by GameService)
        await BroadcastOnlinePlayersAsync();
    }

    /// <summary>Decline a pending challenge — notifies the challenger.</summary>
    public async Task DeclineChallenge(string challengerIdStr)
    {
        var callerId = CallerId;
        if (callerId is null || !Guid.TryParse(challengerIdStr, out var challengerId)) return;

        var callerUsername = CallerUsername;
        challenges.Decline(challengerId, callerId.Value, out _);

        var challengerConnId = tracker.GetConnectionId(challengerId);
        if (challengerConnId is not null)
            await Clients.Client(challengerConnId).SendAsync("ChallengeDeclined", callerUsername);
    }

    /// <summary>Cancel a challenge that was previously sent to a target player.</summary>
    public async Task CancelChallenge(string targetPlayerIdStr)
    {
        var callerId = CallerId;
        if (callerId is null || !Guid.TryParse(targetPlayerIdStr, out var targetId)) return;

        challenges.Cancel(callerId.Value, targetId);

        var targetConnId = tracker.GetConnectionId(targetId);
        if (targetConnId is not null)
            await Clients.Client(targetConnId).SendAsync("ChallengeCancelled", callerId.Value.ToString());
    }
}

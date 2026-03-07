namespace api.DTOs.Players;

/// <summary>
/// Snapshot of a player's online presence. Broadcast via SignalR to all lobby members.
/// Status: "Online" | "InGame"
/// </summary>
public record OnlinePlayerInfo(
    Guid PlayerId,
    string Username,
    string? AvatarUrl,
    string Status,
    string? GameId);

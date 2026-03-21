namespace api.Services;

/// <summary>
/// Per-language notification text for all push notification types.
/// Supported languages: "pt", "en" (default for any other value).
/// </summary>
public static class NotificationL10n
{
    private static readonly HashSet<string> Supported = ["pt", "en"];

    /// <summary>Returns "pt" or "en"; falls back to "en" for unknown locales.</summary>
    public static string Normalize(string? lang) =>
        lang is not null && Supported.Contains(lang) ? lang : "en";

    public static (string Title, string Body) Mention(string lang, string senderUsername, string body) =>
        lang switch
        {
            "pt" => ($"@{senderUsername} te mencionou", body),
            _    => ($"@{senderUsername} mentioned you", body),
        };

    public static (string Title, string Body) Reply(string lang, string replierUsername, string body) =>
        lang switch
        {
            "pt" => ($"@{replierUsername} respondeu você", body),
            _    => ($"@{replierUsername} replied to you", body),
        };

    public static (string Title, string Body) GameCreated(string lang, string creatorUsername) =>
        lang switch
        {
            "pt" => ($"{creatorUsername} está procurando adversário!", "Toque para entrar na partida"),
            _    => ($"{creatorUsername} is looking for an opponent!", "Tap to join the match"),
        };

    public static (string Title, string Body) PlayerJoined(string lang, string joinerUsername) =>
        lang switch
        {
            "pt" => ($"{joinerUsername} entrou na sua partida!", "Toque para jogar"),
            _    => ($"{joinerUsername} joined your game!", "Tap to play"),
        };

    public static (string Title, string Body) NewUser(string lang, string username, bool isNostr) =>
        lang switch
        {
            "pt" => ($"Novo jogador: {username}", $"Entrou pelo {(isNostr ? "Nostr" : "e-mail")}. Venha jogar!"),
            _    => ($"New player: {username}", $"Joined via {(isNostr ? "Nostr" : "e-mail")}. Come play!"),
        };
}

namespace api.Models;

public class PlayerFcmToken
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid PlayerId { get; set; }
    public Player Player { get; set; } = null!;

    /// <summary>FCM registration token sent by the mobile device.</summary>
    public string Token { get; set; } = string.Empty;

    /// <summary>"android" or "ios"</summary>
    public string Platform { get; set; } = string.Empty;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

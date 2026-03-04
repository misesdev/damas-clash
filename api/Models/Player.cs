namespace api.Models;

public class Player
{
    public Guid Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public bool IsEmailConfirmed { get; set; }
    public string? EmailConfirmationCode { get; set; }
    public DateTimeOffset? EmailConfirmationCodeExpiry { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}

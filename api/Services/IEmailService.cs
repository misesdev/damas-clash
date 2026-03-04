namespace api.Services;

public interface IEmailService
{
    Task SendConfirmationEmailAsync(string to, string code, CancellationToken ct = default);
    Task SendLoginCodeAsync(string to, string code, CancellationToken ct = default);
}

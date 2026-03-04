using SendGrid;
using SendGrid.Helpers.Mail;

namespace api.Services;

public class SendGridEmailService(IConfiguration config) : IEmailService
{
    public Task SendConfirmationEmailAsync(string to, string code, CancellationToken ct = default) =>
        Send(to, "Confirme seu e-mail",
            $"Seu código de confirmação é: {code}",
            $"<p>Seu código de confirmação é: <strong>{code}</strong></p>",
            ct);

    public Task SendLoginCodeAsync(string to, string code, CancellationToken ct = default) =>
        Send(to, "Código de acesso",
            $"Seu código de acesso é: {code}",
            $"<p>Seu código de acesso é: <strong>{code}</strong></p>",
            ct);

    private async Task Send(string to, string subject, string text, string html, CancellationToken ct)
    {
        var apiKey = config["SendGrid:ApiKey"] ?? throw new InvalidOperationException("SendGrid:ApiKey not configured.");
        var fromEmail = config["SendGrid:FromEmail"] ?? "noreply@damas.com";
        var fromName = config["SendGrid:FromName"] ?? "Damas";

        var client = new SendGridClient(apiKey);
        var msg = new SendGridMessage
        {
            From = new EmailAddress(fromEmail, fromName),
            Subject = subject,
            PlainTextContent = text,
            HtmlContent = html
        };
        msg.AddTo(new EmailAddress(to));

        await client.SendEmailAsync(msg, ct);
    }
}

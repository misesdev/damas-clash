using SendGrid;
using SendGrid.Helpers.Mail;

namespace api.Services;

public class SendGridEmailService(IConfiguration config) : IEmailService
{
    private const string AppName = "Damas Clash";

    public Task SendConfirmationEmailAsync(string to, string code, CancellationToken ct = default) =>
        Send(to, $"Confirme seu e-mail {AppName}",
            $"Para verificar seu endereço de e-mail no {AppName}, digite este código: {code}",
            $"<p>Para verificar seu endereço de e-mail no {AppName}, digite este código: <strong>{code}</strong></p>",
            ct);

    public Task SendLoginCodeAsync(string to, string code, CancellationToken ct = default) =>
        Send(to, $"Seu código de verificação do {AppName}",
            $"Para verificar seu endereço de e-mail no {AppName}, digite este código: {code}",
            $"<p>Para verificar seu endereço de e-mail no {AppName}, digite este código: <strong>{code}</strong></p>",
            ct);

    public Task SendEmailChangeCodeAsync(string to, string code, CancellationToken ct = default) =>
        Send(to, $"Confirme sua alteração de e-mail do {AppName}",
            $"Seu código de confirmação de alteração de e-mail no {AppName} é: {code}",
            $"<p>Seu código de confirmação de alteração de e-mail no {AppName} é: <strong>{code}</strong></p>",
            ct);

    private async Task Send(string to, string subject, string text, string html, CancellationToken ct)
    {
        var apiKey = config["SendGrid:ApiKey"] ?? throw new InvalidOperationException("SendGrid:ApiKey not configured.");
        var fromEmail = config["SendGrid:FromEmail"] ?? "noreply@clashapps.com";
        var fromName = config["SendGrid:FromName"] ?? "Damas Clash";

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

using Microsoft.Extensions.Configuration;
using SendGrid;
using SendGrid.Helpers.Mail;

namespace api.Services;

public class SendGridEmailService(IConfiguration config) : IEmailService
{
    public async Task SendConfirmationEmailAsync(string to, string code, CancellationToken ct = default)
    {
        var apiKey = config["SendGrid:ApiKey"] ?? throw new InvalidOperationException("SendGrid:ApiKey not configured.");
        var fromEmail = config["SendGrid:FromEmail"] ?? "noreply@damas.com";
        var fromName = config["SendGrid:FromName"] ?? "Damas";

        var client = new SendGridClient(apiKey);
        var msg = new SendGridMessage
        {
            From = new EmailAddress(fromEmail, fromName),
            Subject = "Confirme seu e-mail",
            PlainTextContent = $"Seu código de confirmação é: {code}",
            HtmlContent = $"<p>Seu código de confirmação é: <strong>{code}</strong></p>"
        };
        msg.AddTo(new EmailAddress(to));

        await client.SendEmailAsync(msg, ct);
    }
}

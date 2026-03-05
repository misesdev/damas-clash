using System.Collections.Concurrent;
using api.Services;

namespace api.tests.Infrastructure;

public class FakeEmailService : IEmailService
{
    private readonly ConcurrentDictionary<string, string> _confirmCodes = new();
    private readonly ConcurrentDictionary<string, string> _loginCodes = new();
    private readonly ConcurrentDictionary<string, string> _emailChangeCodes = new();

    public string? GetCode(string email) => _confirmCodes.GetValueOrDefault(email);
    public string? GetLoginCode(string email) => _loginCodes.GetValueOrDefault(email);
    public string? GetEmailChangeCode(string email) => _emailChangeCodes.GetValueOrDefault(email);

    public Task SendConfirmationEmailAsync(string email, string code, CancellationToken ct = default)
    {
        _confirmCodes[email] = code;
        return Task.CompletedTask;
    }

    public Task SendLoginCodeAsync(string email, string code, CancellationToken ct = default)
    {
        _loginCodes[email] = code;
        return Task.CompletedTask;
    }

    public Task SendEmailChangeCodeAsync(string email, string code, CancellationToken ct = default)
    {
        _emailChangeCodes[email] = code;
        return Task.CompletedTask;
    }
}

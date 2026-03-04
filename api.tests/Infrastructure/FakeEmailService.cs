using System.Collections.Concurrent;
using api.Services;

namespace api.tests.Infrastructure;

public class FakeEmailService : IEmailService
{
    private readonly ConcurrentDictionary<string, string> _codes = new();

    public string? GetCode(string email) => _codes.GetValueOrDefault(email);

    public Task SendConfirmationEmailAsync(string email, string code, CancellationToken ct = default)
    {
        _codes[email] = code;
        return Task.CompletedTask;
    }
}

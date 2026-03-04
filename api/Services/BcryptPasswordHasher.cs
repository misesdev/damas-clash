using Microsoft.Extensions.Configuration;

namespace api.Services;

public class BcryptPasswordHasher(IConfiguration config) : IPasswordHasher
{
    private readonly int _workFactor = int.TryParse(config["BCrypt:WorkFactor"], out var wf) ? wf : 12;

    public string Hash(string password) =>
        BCrypt.Net.BCrypt.HashPassword(password, _workFactor);

    public bool Verify(string password, string hash) =>
        BCrypt.Net.BCrypt.Verify(password, hash);
}

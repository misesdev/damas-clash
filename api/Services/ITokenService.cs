using api.Models;

namespace api.Services;

public interface ITokenService
{
    string Generate(Player player);
}

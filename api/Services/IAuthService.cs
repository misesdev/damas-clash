using api.DTOs.Auth;
using api.Models;

namespace api.Services;

public interface IAuthService
{
    Task<ServiceResult<RegisterResponse>> RegisterAsync(RegisterRequest req, CancellationToken ct = default);
    Task<ServiceResult<string>> ConfirmEmailAsync(ConfirmEmailRequest req, CancellationToken ct = default);
    Task<ServiceResult<LoginResponse>> LoginAsync(LoginRequest req, CancellationToken ct = default);
}

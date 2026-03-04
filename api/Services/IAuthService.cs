using api.DTOs.Auth;
using api.Models;

namespace api.Services;

public interface IAuthService
{
    Task<ServiceResult<RegisterResponse>> RegisterAsync(RegisterRequest req, CancellationToken ct = default);
    Task<ServiceResult<string>> ConfirmEmailAsync(ConfirmEmailRequest req, CancellationToken ct = default);
    Task<ServiceResult<SendLoginCodeResponse>> LoginAsync(LoginRequest req, CancellationToken ct = default);
    Task<ServiceResult<LoginResponse>> VerifyLoginAsync(VerifyLoginRequest req, CancellationToken ct = default);
    Task<ServiceResult<string>> ResendConfirmationAsync(ResendConfirmationRequest req, CancellationToken ct = default);
}

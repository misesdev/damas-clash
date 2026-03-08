using api.DTOs.Auth;
using api.Models;

namespace api.Services;

public interface IAuthService
{
    Task<ServiceResult<RegisterResponse>> RegisterAsync(RegisterRequest req, CancellationToken ct = default);
    Task<ServiceResult<LoginResponse>> ConfirmEmailAsync(ConfirmEmailRequest req, CancellationToken ct = default);
    Task<ServiceResult<SendLoginCodeResponse>> LoginAsync(LoginRequest req, CancellationToken ct = default);
    Task<ServiceResult<LoginResponse>> VerifyLoginAsync(VerifyLoginRequest req, CancellationToken ct = default);
    Task<ServiceResult<string>> ResendConfirmationAsync(ResendConfirmationRequest req, CancellationToken ct = default);
    Task<ServiceResult<string>> RequestEmailChangeAsync(Guid playerId, string newEmail, CancellationToken ct = default);
    Task<ServiceResult<string>> ConfirmEmailChangeAsync(Guid playerId, string newEmail, string code, CancellationToken ct = default);
    Task<ServiceResult<LoginResponse>> RefreshAsync(string refreshToken, CancellationToken ct = default);
    Task<ServiceResult<string>> DeleteAccountAsync(Guid playerId, CancellationToken ct = default);
    Task<ServiceResult<LoginResponse>> GoogleAuthAsync(string idToken, CancellationToken ct = default);
}

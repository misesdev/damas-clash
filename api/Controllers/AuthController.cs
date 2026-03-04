using api.DTOs.Auth;
using api.Services;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(IAuthService authService) : ControllerBase
{
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request, CancellationToken ct)
    {
        var result = await authService.RegisterAsync(request, ct);

        if (!result.IsSuccess)
        {
            return result.Error switch
            {
                "email_taken" or "username_taken" => Conflict(new { error = result.Error }),
                _ => BadRequest(new { error = result.Error })
            };
        }

        return CreatedAtAction(nameof(Register), result.Value);
    }

    [HttpPost("confirm-email")]
    public async Task<IActionResult> ConfirmEmail([FromBody] ConfirmEmailRequest request, CancellationToken ct)
    {
        var result = await authService.ConfirmEmailAsync(request, ct);

        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });

        return Ok();
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken ct)
    {
        var result = await authService.LoginAsync(request, ct);

        if (!result.IsSuccess)
        {
            return result.Error switch
            {
                "email_not_confirmed" => StatusCode(403, new { error = result.Error }),
                _ => Unauthorized(new { error = result.Error })
            };
        }

        return Ok(result.Value);
    }
}

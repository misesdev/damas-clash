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

    // Step 1: sends a login code to the player's email
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken ct)
    {
        var result = await authService.LoginAsync(request, ct);

        if (!result.IsSuccess)
            return NotFound(new { error = result.Error });

        return Ok(result.Value);
    }

    [HttpPost("resend-confirmation")]
    public async Task<IActionResult> ResendConfirmation([FromBody] ResendConfirmationRequest request, CancellationToken ct)
    {
        var result = await authService.ResendConfirmationAsync(request, ct);

        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });

        return Ok();
    }

    // Step 2: verifies the login code and returns a JWT
    [HttpPost("verify-login")]
    public async Task<IActionResult> VerifyLogin([FromBody] VerifyLoginRequest request, CancellationToken ct)
    {
        var result = await authService.VerifyLoginAsync(request, ct);

        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });

        return Ok(result.Value);
    }
}

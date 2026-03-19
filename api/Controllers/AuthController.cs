using api.Config;
using api.DTOs.Auth;
using api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(IAuthService authService) : ControllerBase
{
    [HttpPost("register")]
    [EnableRateLimiting(RateLimitConfig.EmailVerification)]
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

    [EnableRateLimiting(RateLimitConfig.EmailVerification)]
    [HttpPost("confirm-email")]
    public async Task<IActionResult> ConfirmEmail([FromBody] ConfirmEmailRequest request, CancellationToken ct)
    {
        var result = await authService.ConfirmEmailAsync(request, ct);

        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });

        return Ok(result.Value);
    }

    // Step 1: sends a login code to the player's email
    [EnableRateLimiting(RateLimitConfig.EmailVerification)]
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken ct)
    {
        var result = await authService.LoginAsync(request, ct);

        if (!result.IsSuccess)
            return NotFound(new { error = result.Error });

        return Ok(result.Value);
    }

    [HttpPost("resend-confirmation")]
    [EnableRateLimiting(RateLimitConfig.EmailVerification)]
    public async Task<IActionResult> ResendConfirmation([FromBody] ResendConfirmationRequest request, CancellationToken ct)
    {
        var result = await authService.ResendConfirmationAsync(request, ct);

        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });

        return Ok();
    }

    // Step 2: verifies the login code and returns a JWT
    [EnableRateLimiting(RateLimitConfig.EmailVerification)]
    [HttpPost("verify-login")]
    public async Task<IActionResult> VerifyLogin([FromBody] VerifyLoginRequest request, CancellationToken ct)
    {
        var result = await authService.VerifyLoginAsync(request, ct);

        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });

        return Ok(result.Value);
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshRequest request, CancellationToken ct)
    {
        var result = await authService.RefreshAsync(request.RefreshToken, ct);

        if (!result.IsSuccess)
            return Unauthorized(new { error = result.Error });

        return Ok(result.Value);
    }

    [Authorize]
    [HttpPost("request-email-change")]
    public async Task<IActionResult> RequestEmailChange([FromBody] RequestEmailChangeRequest request, CancellationToken ct)
    {
        var playerId = GetCallerId();
        if (playerId is null) return Forbid();

        var result = await authService.RequestEmailChangeAsync(playerId.Value, request.NewEmail.Trim(), ct);

        if (!result.IsSuccess)
        {
            if (result.IsNotFound) return NotFound();
            return result.Error switch
            {
                "email_taken" => Conflict(new { error = result.Error }),
                _ => BadRequest(new { error = result.Error })
            };
        }

        return Ok();
    }

    [Authorize]
    [HttpPost("confirm-email-change")]
    public async Task<IActionResult> ConfirmEmailChange([FromBody] ConfirmEmailChangeRequest request, CancellationToken ct)
    {
        var playerId = GetCallerId();
        if (playerId is null) return Forbid();

        var result = await authService.ConfirmEmailChangeAsync(playerId.Value, request.NewEmail.Trim(), request.Code, ct);

        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });

        return Ok();
    }

    [Authorize]
    [HttpDelete("account")]
    public async Task<IActionResult> DeleteAccount(CancellationToken ct)
    {
        var playerId = GetCallerId();
        if (playerId is null) return Forbid();

        var result = await authService.DeleteAccountAsync(playerId.Value, ct);

        if (!result.IsSuccess)
            return result.IsNotFound ? NotFound() : BadRequest(new { error = result.Error });

        return NoContent();
    }

    [EnableRateLimiting(RateLimitConfig.NostrLogin)]
    [HttpGet("nostr/challenge")]
    public IActionResult NostrChallenge([FromServices] INostrChallengeStore store, [FromQuery] string pubkey)
    {
        // pubkey must be a 64-char lowercase hex Nostr x-only public key.
        if (string.IsNullOrEmpty(pubkey) || pubkey.Length != 64 ||
            !pubkey.All(c => (c >= '0' && c <= '9') || (c >= 'a' && c <= 'f')))
            return BadRequest(new { error = "invalid_pubkey" });

        return Ok(new NostrChallengeResponse(store.Generate(pubkey)));
    }

    [EnableRateLimiting(RateLimitConfig.NostrLogin)]
    [HttpPost("nostr/login")]
    public async Task<IActionResult> NostrLogin([FromBody] NostrLoginRequest request, CancellationToken ct)
    {
        var result = await authService.NostrAuthAsync(request, ct);

        if (!result.IsSuccess)
            return result.Error switch
            {
                "invalid_signature" or "invalid_challenge" => Unauthorized(new { error = result.Error }),
                _ => BadRequest(new { error = result.Error })
            };

        return Ok(result.Value);
    }

    [EnableRateLimiting(RateLimitConfig.NostrLogin)]
    [HttpPost("nostr/login-event")]
    public async Task<IActionResult> NostrLoginEvent([FromBody] NostrEventLoginRequest request, CancellationToken ct)
    {
        var result = await authService.NostrEventAuthAsync(request, ct);

        if (!result.IsSuccess)
            return result.Error switch
            {
                "invalid_signature" or "invalid_challenge" or "invalid_event_kind" or "missing_challenge_tag"
                    => Unauthorized(new { error = result.Error }),
                _ => BadRequest(new { error = result.Error })
            };

        return Ok(result.Value);
    }

    [HttpPost("google")]
    public async Task<IActionResult> GoogleAuth([FromBody] GoogleAuthRequest request, CancellationToken ct)
    {
        var result = await authService.GoogleAuthAsync(request.IdToken, ct);

        if (!result.IsSuccess)
            return result.Error == "invalid_google_token"
                ? Unauthorized(new { error = result.Error })
                : BadRequest(new { error = result.Error });

        return Ok(result.Value);
    }

    private Guid? GetCallerId()
    {
        var value = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(value, out var id) ? id : null;
    }
}

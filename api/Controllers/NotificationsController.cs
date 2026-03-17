using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using api.Data;
using api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.Controllers;

[ApiController]
[Route("api/notifications")]
[Authorize]
public class NotificationsController(DamasDbContext db) : ControllerBase
{
    private Guid? CallerId =>
        Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : null;

    /// <summary>
    /// Registers (or upserts) the FCM token for the authenticated player.
    /// Called after login and whenever Firebase rotates the token.
    /// </summary>
    [HttpPost("fcm-token")]
    public async Task<IActionResult> Register([FromBody] RegisterFcmTokenRequest request)
    {
        var callerId = CallerId;
        if (callerId is null) return Unauthorized();

        // Upsert by token value — if the same physical device re-registers,
        // update its owner (handles device hand-off or re-login edge cases).
        var existing = await db.PlayerFcmTokens
            .FirstOrDefaultAsync(t => t.Token == request.Token);

        if (existing is null)
        {
            db.PlayerFcmTokens.Add(new PlayerFcmToken
            {
                PlayerId = callerId.Value,
                Token = request.Token,
                Platform = request.Platform,
            });
        }
        else
        {
            existing.PlayerId = callerId.Value;
            existing.Platform = request.Platform;
            existing.UpdatedAt = DateTime.UtcNow;
        }

        await db.SaveChangesAsync();
        return Ok();
    }

    /// <summary>
    /// Removes all FCM tokens for the authenticated player (called on logout).
    /// </summary>
    [HttpDelete("fcm-token")]
    public async Task<IActionResult> UnregisterAll()
    {
        var callerId = CallerId;
        if (callerId is null) return Unauthorized();

        var tokens = await db.PlayerFcmTokens
            .Where(t => t.PlayerId == callerId.Value)
            .ToListAsync();

        db.PlayerFcmTokens.RemoveRange(tokens);
        await db.SaveChangesAsync();
        return Ok();
    }
}

public record RegisterFcmTokenRequest(
    [Required] string Token,
    [Required] string Platform);

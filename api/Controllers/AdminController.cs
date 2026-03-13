using System.Security.Claims;
using api.Data;
using api.Models;
using api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.Controllers;

[Authorize]
[ApiController]
[Route("api/admin")]
public class AdminController(
    DamasDbContext db,
    IDashboardService dashboardService) : ControllerBase
{
    private Guid? CallerId =>
        Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : null;

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard(CancellationToken ct)
    {
        var callerId = CallerId;
        if (callerId is null) return Unauthorized();

        var player = await db.Players.FindAsync([callerId.Value], ct);
        if (player is null || player.Role != PlayerRole.Admin)
            return StatusCode(403, new { error = "admin_only" });

        var stats = await dashboardService.GetAsync(ct);
        return Ok(stats);
    }
}

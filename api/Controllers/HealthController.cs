using api.Data;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers;

[ApiController]
[Route("api/health")]
public class HealthController(DamasDbContext db) : ControllerBase
{
    [HttpGet]
    public IActionResult Get() => Ok(new { status = "ok" });

    [HttpGet("db")]
    public async Task<IActionResult> GetDb(CancellationToken ct)
    {
        await db.Database.CanConnectAsync(ct);
        return Ok(new { status = "ok", database = "postgres" });
    }
}

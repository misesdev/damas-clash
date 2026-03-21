using Microsoft.AspNetCore.Mvc;

namespace api.Controllers;

[ApiController]
[Route("api/app")]
public class AppController(IConfiguration config) : ControllerBase
{
    /// <summary>
    /// Returns the minimum required app version.
    /// No authentication required — called before login during startup.
    /// </summary>
    [HttpGet("version")]
    public IActionResult GetVersion()
    {
        var minVersion = config["AppVersion:MinVersion"] ?? "1.0";
        return Ok(new { minVersion });
    }
}

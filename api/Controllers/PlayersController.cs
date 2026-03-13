using System.Security.Claims;
using api.DTOs.Players;
using api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers;

[ApiController]
[Route("api/players")]
public class PlayersController(IPlayerService playerService, IGameService gameService, ILightningAddressValidator lightningValidator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var players = await playerService.GetAllAsync(ct);
        return Ok(players);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var player = await playerService.GetByIdAsync(id, ct);
        return player is null ? NotFound() : Ok(player);
    }

    [Authorize]
    [HttpPost("{id:guid}/avatar")]
    [RequestSizeLimit(10 * 1024 * 1024)] // 10 MB
    public async Task<IActionResult> UpdateAvatar(Guid id, IFormFile file, CancellationToken ct)
    {
        var callerId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (callerId is null || !Guid.TryParse(callerId, out var callerGuid) || callerGuid != id)
            return Forbid();

        await using var stream = file.OpenReadStream();
        var result = await playerService.UpdateAvatarAsync(id, stream, file.FileName, file.ContentType, ct);

        if (!result.IsSuccess)
            return result.IsNotFound ? NotFound() : BadRequest(new { error = result.Error });

        return Ok(new { avatarUrl = result.Value });
    }

    [HttpGet("{id:guid}/stats")]
    public async Task<IActionResult> GetPlayerStats(Guid id, CancellationToken ct)
    {
        var stats = await gameService.GetPlayerStatsAsync(id, ct);
        return Ok(stats);
    }

    [Authorize]
    [HttpGet("{id:guid}/games")]
    public async Task<IActionResult> GetPlayerGames(Guid id, CancellationToken ct)
    {
        var games = await gameService.GetCompletedByPlayerAsync(id, ct);
        return Ok(games);
    }

    /// <summary>GET /api/players/validate-lightning-address?address=user@domain — validate without saving.</summary>
    [HttpGet("validate-lightning-address")]
    public async Task<IActionResult> ValidateLightningAddress([FromQuery] string address, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(address))
            return BadRequest(new { error = "address_required" });

        var result = await lightningValidator.ValidateAsync(address, ct);
        if (!result.IsSuccess)
            return UnprocessableEntity(new { error = result.Error });

        return Ok(new { callback = result.Value!.Callback, minSendable = result.Value.MinSendable, maxSendable = result.Value.MaxSendable });
    }

    /// <summary>PUT /api/players/{id}/lightning-address — validate and save Lightning Address.</summary>
    [Authorize]
    [HttpPut("{id:guid}/lightning-address")]
    public async Task<IActionResult> UpdateLightningAddress(Guid id, [FromBody] UpdateLightningAddressRequest request, CancellationToken ct)
    {
        var callerId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (callerId is null || !Guid.TryParse(callerId, out var callerGuid) || callerGuid != id)
            return Forbid();

        var result = await playerService.UpdateLightningAddressAsync(id, request.Address, ct);
        if (!result.IsSuccess)
        {
            if (result.IsNotFound) return NotFound();
            return result.Error switch
            {
                "invalid_format" => BadRequest(new { error = result.Error }),
                _ => UnprocessableEntity(new { error = result.Error })
            };
        }

        return Ok(result.Value);
    }

    [Authorize]
    [HttpPatch("{id:guid}")]
    public async Task<IActionResult> UpdateUsername(Guid id, [FromBody] UpdateUsernameRequest request, CancellationToken ct)
    {
        var callerId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (callerId is null || !Guid.TryParse(callerId, out var callerGuid) || callerGuid != id)
            return Forbid();

        var result = await playerService.UpdateUsernameAsync(id, request.Username.Trim(), ct);

        if (!result.IsSuccess)
        {
            if (result.IsNotFound) return NotFound();
            return result.Error switch
            {
                "username_taken" => Conflict(new { error = result.Error }),
                _ => BadRequest(new { error = result.Error })
            };
        }

        return Ok(result.Value);
    }
}

using System.Security.Claims;
using api.DTOs.Games;
using api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers;

[ApiController]
[Route("api/games")]
public class GamesController(IGameService gameService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetActive(CancellationToken ct)
    {
        var games = await gameService.GetActiveAsync(ct);
        return Ok(games);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var game = await gameService.GetByIdAsync(id, ct);
        return game is null ? NotFound() : Ok(game);
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Create(CancellationToken ct)
    {
        var playerId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await gameService.CreateAsync(playerId, ct);
        return CreatedAtAction(nameof(GetById), new { id = result.Value!.Id }, result.Value);
    }

    [HttpPost("{id:guid}/join")]
    [Authorize]
    public async Task<IActionResult> Join(Guid id, CancellationToken ct)
    {
        var playerId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await gameService.JoinAsync(id, playerId, ct);

        if (!result.IsSuccess)
            return result.IsNotFound ? NotFound(result.Error) : BadRequest(result.Error);

        return Ok(result.Value);
    }

    [HttpDelete("{id:guid}")]
    [Authorize]
    public async Task<IActionResult> Cancel(Guid id, CancellationToken ct)
    {
        var playerId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await gameService.CancelAsync(id, playerId, ct);

        if (!result.IsSuccess)
        {
            if (result.IsNotFound) return NotFound(new { error = result.Error });
            return result.Error switch
            {
                "not_creator" => Forbid(),
                _ => BadRequest(new { error = result.Error })
            };
        }

        return NoContent();
    }

    [HttpPost("{id:guid}/moves")]
    [Authorize]
    public async Task<IActionResult> MakeMove(Guid id, [FromBody] MakeMoveRequest request, CancellationToken ct)
    {
        var playerId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await gameService.MakeMoveAsync(id, request, playerId, ct);

        if (!result.IsSuccess)
            return result.IsNotFound ? NotFound(result.Error) : BadRequest(result.Error);

        return Ok(result.Value);
    }
}

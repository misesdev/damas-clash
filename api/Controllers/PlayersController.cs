using api.DTOs.Players;
using api.Services;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers;

[ApiController]
[Route("api/players")]
public class PlayersController(IPlayerService playerService) : ControllerBase
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
}

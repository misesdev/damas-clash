using api.DTOs.Games;
using api.Services;
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
    public async Task<IActionResult> Create([FromBody] CreateGameRequest request, CancellationToken ct)
    {
        var game = await gameService.CreateAsync(request, ct);
        return CreatedAtAction(nameof(GetById), new { id = game.Id }, game);
    }

    [HttpPost("{id:guid}/join")]
    public async Task<IActionResult> Join(Guid id, [FromBody] JoinGameRequest request, CancellationToken ct)
    {
        var game = await gameService.JoinAsync(id, request, ct);
        return game is null ? NotFound() : Ok(game);
    }

    [HttpPost("{id:guid}/moves")]
    public async Task<IActionResult> MakeMove(Guid id, [FromBody] MakeMoveRequest request, CancellationToken ct)
    {
        var game = await gameService.MakeMoveAsync(id, request, ct);
        return game is null ? NotFound() : Ok(game);
    }
}

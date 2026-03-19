using System.Security.Claims;
using api.DTOs.Games;
using api.Models.Enums;
using api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;

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
    public async Task<IActionResult> Create([FromBody(EmptyBodyBehavior = EmptyBodyBehavior.Allow)] CreateGameRequest? request, CancellationToken ct)
    {
        if (CallerId() is not { } playerId) return Unauthorized();
        var betAmount = request?.BetAmountSats ?? 0;
        var result = await gameService.CreateAsync(playerId, betAmount, ct);
        if (!result.IsSuccess)
            return BadRequest(result.Error);
        return CreatedAtAction(nameof(GetById), new { id = result.Value!.Id }, result.Value);
    }

    [HttpPost("{id:guid}/join")]
    [Authorize]
    public async Task<IActionResult> Join(Guid id, CancellationToken ct)
    {
        if (CallerId() is not { } playerId) return Unauthorized();
        var result = await gameService.JoinAsync(id, playerId, ct);

        if (!result.IsSuccess)
            return result.IsNotFound ? NotFound(result.Error) : BadRequest(result.Error);

        return Ok(result.Value);
    }

    [HttpDelete("{id:guid}")]
    [Authorize]
    public async Task<IActionResult> Cancel(Guid id, CancellationToken ct)
    {
        if (CallerId() is not { } playerId) return Unauthorized();
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

    [HttpPost("{id:guid}/skip-turn")]
    [Authorize]
    public async Task<IActionResult> SkipTurn(Guid id, [FromBody(EmptyBodyBehavior = EmptyBodyBehavior.Allow)] SkipTurnRequest? body, CancellationToken ct)
    {
        if (CallerId() is not { } playerId) return Unauthorized();
        PieceColor? expected = body?.ExpectedCurrentTurn is string s && Enum.TryParse<PieceColor>(s, out var parsed) ? parsed : null;
        var result = await gameService.SkipTurnAsync(id, playerId, expected, ct);

        if (!result.IsSuccess)
            return result.IsNotFound ? NotFound(result.Error) : BadRequest(result.Error);

        return Ok(result.Value);
    }

    [HttpPost("{id:guid}/resign")]
    [Authorize]
    public async Task<IActionResult> Resign(Guid id, CancellationToken ct)
    {
        if (CallerId() is not { } playerId) return Unauthorized();
        var result = await gameService.ResignAsync(id, playerId, ct);

        if (!result.IsSuccess)
            return result.IsNotFound ? NotFound(result.Error) : BadRequest(result.Error);

        return Ok(result.Value);
    }

    [HttpGet("{id:guid}/moves")]
    public async Task<IActionResult> GetMoves(Guid id, CancellationToken ct)
    {
        var moves = await gameService.GetMovesAsync(id, ct);
        return Ok(moves);
    }

    [HttpPost("{id:guid}/moves")]
    [Authorize]
    public async Task<IActionResult> MakeMove(Guid id, [FromBody] MakeMoveRequest request, CancellationToken ct)
    {
        if (CallerId() is not { } playerId) return Unauthorized();
        var result = await gameService.MakeMoveAsync(id, request, playerId, ct);

        if (!result.IsSuccess)
            return result.IsNotFound ? NotFound(result.Error) : BadRequest(result.Error);

        return Ok(result.Value);
    }

    private Guid? CallerId()
    {
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(value, out var id) ? id : null;
    }
}

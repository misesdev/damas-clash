using api.Data;
using api.DTOs.Players;
using api.Models;
using Microsoft.EntityFrameworkCore;

namespace api.Services;

public class PlayerService(DamasDbContext db) : IPlayerService
{
    public async Task<PlayerResponse?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var player = await db.Players.FindAsync([id], ct);
        return player is null ? null : ToResponse(player);
    }

    public async Task<IEnumerable<PlayerResponse>> GetAllAsync(CancellationToken ct = default)
    {
        return await db.Players
            .Select(p => new PlayerResponse(p.Id, p.Username, p.CreatedAt))
            .ToListAsync(ct);
    }

    private static PlayerResponse ToResponse(Player p) =>
        new(p.Id, p.Username, p.CreatedAt);
}

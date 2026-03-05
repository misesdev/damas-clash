using api.Data;
using api.DTOs.Players;
using api.Models;
using Microsoft.EntityFrameworkCore;

namespace api.Services;

public class PlayerService(DamasDbContext db, ICloudinaryService cloudinary) : IPlayerService
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

    public async Task<ServiceResult<PlayerResponse>> UpdateUsernameAsync(Guid id, string username, CancellationToken ct = default)
    {
        if (await db.Players.AnyAsync(p => p.Username == username && p.Id != id, ct))
            return ServiceResult<PlayerResponse>.Fail("username_taken");

        var player = await db.Players.FindAsync([id], ct);
        if (player is null)
            return ServiceResult<PlayerResponse>.NotFound("player_not_found");

        player.Username = username;
        await db.SaveChangesAsync(ct);

        return ServiceResult<PlayerResponse>.Ok(ToResponse(player));
    }

    public async Task<ServiceResult<string>> UpdateAvatarAsync(Guid id, Stream stream, string fileName, string contentType, CancellationToken ct = default)
    {
        var player = await db.Players.FindAsync([id], ct);
        if (player is null)
            return ServiceResult<string>.NotFound("player_not_found");

        var url = await cloudinary.UploadAvatarAsync(stream, fileName, contentType, ct);
        player.AvatarUrl = url;
        await db.SaveChangesAsync(ct);

        return ServiceResult<string>.Ok(url);
    }

    private static PlayerResponse ToResponse(Player p) =>
        new(p.Id, p.Username, p.CreatedAt);
}

using api.Models;
using Microsoft.EntityFrameworkCore;

namespace api.Data;

public class DamasDbContext(DbContextOptions<DamasDbContext> options) : DbContext(options)
{
    public DbSet<Player> Players => Set<Player>();
    public DbSet<Game> Games => Set<Game>();
    public DbSet<Move> Moves => Set<Move>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Player>(e =>
        {
            e.HasKey(p => p.Id);
            e.HasIndex(p => p.Username).IsUnique();
            e.HasIndex(p => p.Email).IsUnique();
            e.HasIndex(p => p.GoogleId).IsUnique().HasFilter("\"GoogleId\" IS NOT NULL");
            e.Property(p => p.Username).IsRequired().HasMaxLength(50);
            e.Property(p => p.Email).IsRequired().HasMaxLength(256);
            e.Property(p => p.IsEmailConfirmed).HasDefaultValue(false);
        });

        modelBuilder.Entity<Game>(e =>
        {
            e.HasKey(g => g.Id);
            e.Property(g => g.BoardState).IsRequired();
            e.HasOne(g => g.PlayerBlack)
                .WithMany()
                .HasForeignKey(g => g.PlayerBlackId)
                .OnDelete(DeleteBehavior.SetNull);
            e.HasOne(g => g.PlayerWhite)
                .WithMany()
                .HasForeignKey(g => g.PlayerWhiteId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Move>(e =>
        {
            e.HasKey(m => m.Id);
            e.HasOne(m => m.Game)
                .WithMany(g => g.Moves)
                .HasForeignKey(m => m.GameId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(m => m.Player)
                .WithMany()
                .HasForeignKey(m => m.PlayerId)
                .OnDelete(DeleteBehavior.SetNull);
        });
    }
}

using api.Models;
using Microsoft.EntityFrameworkCore;

namespace api.Data;

public class DamasDbContext(DbContextOptions<DamasDbContext> options) : DbContext(options)
{
    public DbSet<Player> Players => Set<Player>();
    public DbSet<Game> Games => Set<Game>();
    public DbSet<Move> Moves => Set<Move>();
    public DbSet<Wallet> Wallets => Set<Wallet>();
    public DbSet<LedgerEntry> LedgerEntries => Set<LedgerEntry>();
    public DbSet<LightningPayment> LightningPayments => Set<LightningPayment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Player>(e =>
        {
            e.HasKey(p => p.Id);
            e.HasIndex(p => p.Username).IsUnique();
            e.HasIndex(p => p.Email).IsUnique().HasFilter("\"Email\" IS NOT NULL");
            e.HasIndex(p => p.GoogleId).IsUnique().HasFilter("\"GoogleId\" IS NOT NULL");
            e.HasIndex(p => p.NostrPubKey).IsUnique().HasFilter("\"NostrPubKey\" IS NOT NULL");
            e.Property(p => p.NostrPubKey).HasMaxLength(64);
            e.Property(p => p.Username).IsRequired().HasMaxLength(50);
            e.Property(p => p.Email).HasMaxLength(256);
            e.Property(p => p.IsEmailConfirmed).HasDefaultValue(false);
            e.Property(p => p.LightningAddress).HasMaxLength(320);
        });

        modelBuilder.Entity<Game>(e =>
        {
            e.HasKey(g => g.Id);
            e.Property(g => g.BoardState).IsRequired();
            e.Property(g => g.BetAmountSats).HasDefaultValue(0L);
            e.Property(g => g.BetSettled).HasDefaultValue(false);
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

        modelBuilder.Entity<Wallet>(e =>
        {
            e.HasKey(w => w.Id);
            e.HasIndex(w => w.PlayerId).IsUnique();
            e.Property(w => w.BalanceSats).HasDefaultValue(0L);
            e.Property(w => w.LockedBalanceSats).HasDefaultValue(0L);
            e.HasOne(w => w.Player)
                .WithMany()
                .HasForeignKey(w => w.PlayerId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<LedgerEntry>(e =>
        {
            e.HasKey(l => l.Id);
            e.HasOne(l => l.Player)
                .WithMany()
                .HasForeignKey(l => l.PlayerId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(l => l.Game)
                .WithMany()
                .HasForeignKey(l => l.GameId)
                .OnDelete(DeleteBehavior.SetNull);
            e.HasOne(l => l.Payment)
                .WithMany()
                .HasForeignKey(l => l.PaymentId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<LightningPayment>(e =>
        {
            e.HasKey(p => p.Id);
            e.HasIndex(p => p.PaymentHash);
            e.HasOne(p => p.Player)
                .WithMany()
                .HasForeignKey(p => p.PlayerId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}

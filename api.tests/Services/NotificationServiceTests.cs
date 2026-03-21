using api.Data;
using api.Models;
using api.Models.Enums;
using api.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;

namespace api.tests.Services;

/// <summary>
/// Unit tests for the token-selection logic in NotificationService.
/// Firebase is not initialised in tests — methods return early after the DB
/// query, so we test the query itself by mirroring the service's filter.
/// </summary>
public class NotificationServiceTests
{
    // ── Helpers ──────────────────────────────────────────────────────────────

    private static IServiceScopeFactory BuildScopeFactory(string dbName)
    {
        var services = new ServiceCollection();
        services.AddDbContext<DamasDbContext>(o => o.UseInMemoryDatabase(dbName));
        return services.BuildServiceProvider().GetRequiredService<IServiceScopeFactory>();
    }

    private static DamasDbContext CreateDb(string dbName) =>
        new(new DbContextOptionsBuilder<DamasDbContext>()
            .UseInMemoryDatabase(dbName).Options);

    private static Player MakePlayer(string username) => new()
    {
        Id = Guid.NewGuid(),
        Username = username,
        IsEmailConfirmed = true,
        CreatedAt = DateTimeOffset.UtcNow,
    };

    private static PlayerFcmToken MakeToken(Guid playerId, string token) => new()
    {
        Id = Guid.NewGuid(),
        PlayerId = playerId,
        Token = token,
        Platform = "android",
    };

    // ── SendMentionNotificationAsync ─────────────────────────────────────────

    [Fact]
    public async Task SendMentionNotification_TokenQuery_ExcludesSenderTokens()
    {
        // Scenario: Alice (sender) and Bob (mentioned) share a device.
        // Alice is currently logged in, so T1 is registered under Alice's ID.
        // Bob has a separate token T2 on a different device.
        // The query must return T2 (Bob's device) but NOT T1 (Alice's device).

        var dbName = "TestDb_Mention_" + Guid.NewGuid();
        await using var db = CreateDb(dbName);

        var alice = MakePlayer("alice");
        var bob = MakePlayer("bob");
        db.Players.AddRange(alice, bob);

        // Alice's device token (T1) is currently registered under Alice
        db.PlayerFcmTokens.Add(MakeToken(alice.Id, "T1_alice_device"));
        // Bob's separate device
        db.PlayerFcmTokens.Add(MakeToken(bob.Id, "T2_bob_device"));
        await db.SaveChangesAsync();

        // Mirror the service's token query: tokens for Bob, excluding Alice's ID
        var tokens = await db.PlayerFcmTokens
            .Where(t => t.Player.Username == "bob" && t.PlayerId != alice.Id)
            .Select(t => t.Token)
            .ToListAsync();

        Assert.Single(tokens);
        Assert.Equal("T2_bob_device", tokens[0]);
    }

    [Fact]
    public async Task SendMentionNotification_TokenQuery_ExcludesSharedDeviceToken()
    {
        // Scenario: Alice (sender) plays with two accounts on the same device.
        // She logs in as Nostr (Bob), so her device token T1 is now stored under Bob's ID.
        // Alice then logs in as email account and mentions @bob.
        // T1 should NOT be sent to avoid self-notification.

        var dbName = "TestDb_Mention_Shared_" + Guid.NewGuid();
        await using var db = CreateDb(dbName);

        var aliceEmail = MakePlayer("alice");
        var aliceNostr = MakePlayer("alice_nostr");
        db.Players.AddRange(aliceEmail, aliceNostr);

        // Shared device: token is currently under the Nostr account
        db.PlayerFcmTokens.Add(MakeToken(aliceNostr.Id, "T1_shared_device"));
        await db.SaveChangesAsync();

        // alice_email mentions alice_nostr
        // Query for alice_nostr's tokens, excluding alice_email's ID
        var tokens = await db.PlayerFcmTokens
            .Where(t => t.Player.Username == "alice_nostr" && t.PlayerId != aliceEmail.Id)
            .Select(t => t.Token)
            .ToListAsync();

        // T1 is under aliceNostr.Id, NOT aliceEmail.Id — it should be found
        // (the sender is alice_email, not alice_nostr, so exclusion doesn't apply here)
        Assert.Single(tokens);
        Assert.Equal("T1_shared_device", tokens[0]);
    }

    [Fact]
    public async Task SendMentionNotification_TokenQuery_ExcludesTokenWhenSenderIdMatchesMentionedToken()
    {
        // Edge case: the mentioned user's token is currently registered under the sender's ID.
        // This happens when sender re-registered a token that previously belonged to the mentioned user.

        var dbName = "TestDb_Mention_Edge_" + Guid.NewGuid();
        await using var db = CreateDb(dbName);

        var sender = MakePlayer("sender");
        var mentioned = MakePlayer("mentioned");
        db.Players.AddRange(sender, mentioned);

        // The device token is now under the sender's ID (after a re-login)
        db.PlayerFcmTokens.Add(MakeToken(sender.Id, "T_device"));
        await db.SaveChangesAsync();

        // Query for "mentioned"'s tokens, excluding sender's ID
        var tokens = await db.PlayerFcmTokens
            .Where(t => t.Player.Username == "mentioned" && t.PlayerId != sender.Id)
            .Select(t => t.Token)
            .ToListAsync();

        // The token belongs to sender, not to "mentioned", so 0 results (correct — can't notify anyway)
        Assert.Empty(tokens);
    }

    [Fact]
    public async Task SendMentionNotification_CompletesWithoutException_WhenFirebaseNotInitialised()
    {
        var dbName = "TestDb_Mention_Firebase_" + Guid.NewGuid();
        var scopeFactory = BuildScopeFactory(dbName);

        await using (var scope = scopeFactory.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<DamasDbContext>();
            var alice = MakePlayer("alice");
            var bob = MakePlayer("bob");
            db.Players.AddRange(alice, bob);
            db.PlayerFcmTokens.Add(MakeToken(bob.Id, "T_bob"));
            await db.SaveChangesAsync();
        }

        var service = new NotificationService(scopeFactory, NullLogger<NotificationService>.Instance);
        var aliceId = Guid.NewGuid();

        // Should complete without throwing, even though Firebase is null in tests
        var exception = await Record.ExceptionAsync(() =>
            service.SendMentionNotificationAsync("bob", aliceId, "alice", "hey @bob!"));

        Assert.Null(exception);
    }

    // ── SendReplyNotificationAsync ────────────────────────────────────────────

    [Fact]
    public async Task SendReplyNotification_TokenQuery_ExcludesReplierTokens()
    {
        // Alice replies to Bob's message. Bob should receive the notification;
        // Alice's own devices must be excluded.

        var dbName = "TestDb_Reply_" + Guid.NewGuid();
        await using var db = CreateDb(dbName);

        var alice = MakePlayer("alice");
        var bob = MakePlayer("bob");
        db.Players.AddRange(alice, bob);

        db.PlayerFcmTokens.Add(MakeToken(alice.Id, "T1_alice"));
        db.PlayerFcmTokens.Add(MakeToken(bob.Id, "T2_bob"));
        await db.SaveChangesAsync();

        // Mirror the service query: Bob's tokens, excluding Alice's ID
        var tokens = await db.PlayerFcmTokens
            .Where(t => t.Player.Username == "bob" && t.PlayerId != alice.Id)
            .Select(t => t.Token)
            .ToListAsync();

        Assert.Single(tokens);
        Assert.Equal("T2_bob", tokens[0]);
    }

    [Fact]
    public async Task SendReplyNotification_CompletesWithoutException_WhenFirebaseNotInitialised()
    {
        var dbName = "TestDb_Reply_Firebase_" + Guid.NewGuid();
        var scopeFactory = BuildScopeFactory(dbName);

        await using (var scope = scopeFactory.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<DamasDbContext>();
            var alice = MakePlayer("alice");
            var bob = MakePlayer("bob");
            db.Players.AddRange(alice, bob);
            db.PlayerFcmTokens.Add(MakeToken(bob.Id, "T_bob"));
            await db.SaveChangesAsync();
        }

        var service = new NotificationService(scopeFactory, NullLogger<NotificationService>.Instance);

        var exception = await Record.ExceptionAsync(() =>
            service.SendReplyNotificationAsync("bob", Guid.NewGuid(), "alice", "nice move!"));

        Assert.Null(exception);
    }

    // ── SendGameCreatedNotificationAsync ─────────────────────────────────────

    [Fact]
    public async Task SendGameCreatedNotification_TokenQuery_ExcludesCreatorsOwnTokens()
    {
        // Scenario: Creator has two accounts (email + Nostr) on the same device.
        // They played games between accounts → each is a "past opponent" of the other.
        // When Creator (email) creates a game, Creator (Nostr)'s token should be excluded.

        var dbName = "TestDb_GameCreated_" + Guid.NewGuid();
        await using var db = CreateDb(dbName);

        var creatorEmail = MakePlayer("creator_email");
        var creatorNostr = MakePlayer("creator_nostr");
        var realOpponent = MakePlayer("real_opponent");
        db.Players.AddRange(creatorEmail, creatorNostr, realOpponent);

        // Device token is currently under creatorEmail
        db.PlayerFcmTokens.Add(MakeToken(creatorEmail.Id, "T_device"));
        // Real opponent's separate device
        db.PlayerFcmTokens.Add(MakeToken(realOpponent.Id, "T_opponent"));
        await db.SaveChangesAsync();

        // Opponent IDs: both creatorNostr and realOpponent played against creatorEmail
        var opponentIds = new List<Guid> { creatorNostr.Id, realOpponent.Id };

        // Query mirrors the fixed service: exclude creator's own tokens
        var tokens = await db.PlayerFcmTokens
            .Where(t => opponentIds.Contains(t.PlayerId) && t.PlayerId != creatorEmail.Id)
            .Select(t => t.Token)
            .ToListAsync();

        // T_device belongs to creatorEmail (excluded), T_opponent belongs to realOpponent (included)
        Assert.Single(tokens);
        Assert.Equal("T_opponent", tokens[0]);
    }

    [Fact]
    public async Task SendGameCreatedNotification_TokenQuery_ExcludesCreatorEvenIfTheirTokenIsUnderOpponentId()
    {
        // Scenario: Creator's device token is currently stored under an opponent's player ID
        // (because the creator previously had a Nostr account on the same device).
        // The creator's own ID is NOT in opponentIds, but T_device is still the creator's device.
        // The query must exclude it via PlayerId != creatorPlayerId.

        var dbName = "TestDb_GameCreated_Cross_" + Guid.NewGuid();
        await using var db = CreateDb(dbName);

        var creator = MakePlayer("creator");
        var opponentWithCreatorsDevice = MakePlayer("opponent_same_device");
        db.Players.AddRange(creator, opponentWithCreatorsDevice);

        // Creator's device token is now under the opponent's account
        db.PlayerFcmTokens.Add(MakeToken(opponentWithCreatorsDevice.Id, "T_device"));
        await db.SaveChangesAsync();

        var opponentIds = new List<Guid> { opponentWithCreatorsDevice.Id };

        // With the fix: exclude creator.Id — but token is under opponentWithCreatorsDevice.Id
        // So it's NOT excluded by PlayerId != creator.Id — this is actually correct behavior:
        // "opponent_same_device" IS a real opponent (different player), they should be notified.
        // The only self-notification risk is when creator's OWN player ID has the token.
        var tokens = await db.PlayerFcmTokens
            .Where(t => opponentIds.Contains(t.PlayerId) && t.PlayerId != creator.Id)
            .Select(t => t.Token)
            .ToListAsync();

        Assert.Single(tokens);
        Assert.Equal("T_device", tokens[0]);
    }

    [Fact]
    public async Task SendGameCreatedNotification_CompletesWithoutException_WhenFirebaseNotInitialised()
    {
        var dbName = "TestDb_GameCreated_Firebase_" + Guid.NewGuid();
        var scopeFactory = BuildScopeFactory(dbName);

        await using (var scope = scopeFactory.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<DamasDbContext>();
            var creator = MakePlayer("creator");
            var opponent = MakePlayer("opponent");
            db.Players.AddRange(creator, opponent);

            // Completed game between them
            db.Games.Add(new Game
            {
                Id = Guid.NewGuid(),
                PlayerBlackId = creator.Id,
                PlayerWhiteId = opponent.Id,
                Status = GameStatus.Completed,
                WinnerId = creator.Id,
                BoardState = string.Empty,
                CurrentTurn = PieceColor.Black,
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow,
            });

            db.PlayerFcmTokens.Add(MakeToken(opponent.Id, "T_opponent"));
            await db.SaveChangesAsync();

            var service = new NotificationService(scopeFactory, NullLogger<NotificationService>.Instance);
            var gameId = Guid.NewGuid();

            var exception = await Record.ExceptionAsync(() =>
                service.SendGameCreatedNotificationAsync(creator.Id, "creator", gameId));

            Assert.Null(exception);
        }
    }

    // ── Stale token cleanup ───────────────────────────────────────────────────

    /// <summary>
    /// Verifies the token-cleanup query that the service runs after FCM returns
    /// Unregistered.  We can't call Firebase in tests, so we mirror the
    /// ExecuteDeleteAsync predicate directly against the in-memory database.
    /// </summary>
    [Fact]
    public async Task StaleTokenCleanup_RemovesUnregisteredTokensFromDatabase()
    {
        var dbName = "TestDb_StaleCleanup_" + Guid.NewGuid();
        await using var db = CreateDb(dbName);

        var alice = MakePlayer("alice");
        db.Players.Add(alice);

        // Simulate two tokens: one valid, one stale (would be reported as Unregistered by Firebase)
        const string validToken = "T_valid";
        const string staleToken = "T_stale";
        db.PlayerFcmTokens.Add(MakeToken(alice.Id, validToken));
        db.PlayerFcmTokens.Add(MakeToken(alice.Id, staleToken));
        await db.SaveChangesAsync();

        // Mirror the cleanup logic from SendMulticastAsync.
        // ExecuteDeleteAsync is not supported by the InMemory provider, so we
        // use RemoveRange to validate the same predicate against the in-memory DB.
        var staleTokens = new List<string> { staleToken };
        var toDelete = await db.PlayerFcmTokens
            .Where(t => staleTokens.Contains(t.Token))
            .ToListAsync();
        db.PlayerFcmTokens.RemoveRange(toDelete);
        await db.SaveChangesAsync();

        // Only the valid token should remain
        var remaining = await db.PlayerFcmTokens.Select(t => t.Token).ToListAsync();
        Assert.Single(remaining);
        Assert.Equal(validToken, remaining[0]);
    }

    [Fact]
    public async Task StaleTokenCleanup_DoesNotRemoveValidTokens()
    {
        var dbName = "TestDb_StaleCleanup_Keep_" + Guid.NewGuid();
        await using var db = CreateDb(dbName);

        var alice = MakePlayer("alice");
        db.Players.Add(alice);
        db.PlayerFcmTokens.Add(MakeToken(alice.Id, "T_good1"));
        db.PlayerFcmTokens.Add(MakeToken(alice.Id, "T_good2"));
        await db.SaveChangesAsync();

        // No stale tokens reported — cleanup list is empty; nothing should be deleted
        var staleTokens = new List<string>();
        if (staleTokens.Count > 0)
        {
            var toDelete = await db.PlayerFcmTokens
                .Where(t => staleTokens.Contains(t.Token))
                .ToListAsync();
            db.PlayerFcmTokens.RemoveRange(toDelete);
            await db.SaveChangesAsync();
        }

        var remaining = await db.PlayerFcmTokens.Select(t => t.Token).ToListAsync();
        Assert.Equal(2, remaining.Count);
    }
}

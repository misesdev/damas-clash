using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using api.Data;
using api.DTOs.Auth;
using api.DTOs.Games;
using api.DTOs.Wallet;
using api.Models;
using api.Models.Enums;
using api.Services;
using api.tests.Infrastructure;
using Microsoft.Extensions.DependencyInjection;

namespace api.tests.Controllers;

public class WalletControllerTests(CustomWebApplicationFactory factory)
    : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client = factory.CreateClient();
    private readonly FakeEmailService _email = factory.EmailService;
    private readonly FakeLightningGatewayService _gateway = factory.LightningGateway;

    private static readonly JsonSerializerOptions JsonOpts = new(JsonSerializerDefaults.Web)
    {
        Converters = { new System.Text.Json.Serialization.JsonStringEnumConverter() }
    };

    // ── GET /api/wallet ──────────────────────────────────────────────────────

    [Fact]
    public async Task GetWallet_Unauthenticated_Returns401()
    {
        var response = await _client.GetAsync("/api/wallet");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetWallet_NewPlayer_ReturnsZeroBalance()
    {
        var (_, token) = await CreatePlayer("wallet_new");
        Auth(token);

        var response = await _client.GetAsync("/api/wallet");
        ClearAuth();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var wallet = await response.Content.ReadFromJsonAsync<WalletResponse>(JsonOpts);
        Assert.NotNull(wallet);
        Assert.Equal(0, wallet.BalanceSats);
        Assert.Equal(0, wallet.LockedBalanceSats);
        Assert.Equal(0, wallet.AvailableBalanceSats);
    }

    [Fact]
    public async Task GetWallet_AfterCredit_ShowsBalance()
    {
        var (playerId, token) = await CreatePlayer("wallet_credit");
        await CreditWalletDirectly(playerId, 5000);

        Auth(token);
        var response = await _client.GetAsync("/api/wallet");
        ClearAuth();

        var wallet = await response.Content.ReadFromJsonAsync<WalletResponse>(JsonOpts);
        Assert.NotNull(wallet);
        Assert.Equal(5000, wallet.BalanceSats);
        Assert.Equal(5000, wallet.AvailableBalanceSats);
    }

    // ── GET /api/wallet/transactions ──────────────────────────────────────────

    [Fact]
    public async Task GetTransactions_NewPlayer_ReturnsEmptyList()
    {
        var (_, token) = await CreatePlayer("tx_empty");
        Auth(token);

        var response = await _client.GetAsync("/api/wallet/transactions");
        ClearAuth();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var entries = await response.Content.ReadFromJsonAsync<List<LedgerEntryResponse>>(JsonOpts);
        Assert.NotNull(entries);
        Assert.Empty(entries);
    }

    // ── POST /api/wallet/deposit ──────────────────────────────────────────────

    [Fact]
    public async Task Deposit_ValidRequest_ReturnsInvoice()
    {
        var (_, token) = await CreatePlayer("dep_valid");
        _gateway.InvoiceToReturn = "lnbcrt100_test";
        _gateway.RHashToReturn = "hash001";

        Auth(token);
        var response = await _client.PostAsJsonAsync("/api/wallet/deposit",
            new DepositRequest(1000, "test deposit"));
        ClearAuth();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<DepositInitiatedResponse>(JsonOpts);
        Assert.NotNull(result);
        Assert.Equal("lnbcrt100_test", result.Invoice);
        Assert.Equal("hash001", result.RHash);
        Assert.NotEqual(Guid.Empty, result.PaymentId);
    }

    [Fact]
    public async Task Deposit_ZeroAmount_Returns400()
    {
        var (_, token) = await CreatePlayer("dep_zero");
        Auth(token);

        var response = await _client.PostAsJsonAsync("/api/wallet/deposit",
            new DepositRequest(0));
        ClearAuth();

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Deposit_Unauthenticated_Returns401()
    {
        var response = await _client.PostAsJsonAsync("/api/wallet/deposit",
            new DepositRequest(1000));
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ── GET /api/wallet/deposit/{rHash}/status ────────────────────────────────

    [Fact]
    public async Task DepositStatus_PendingInvoice_ReturnsOpenStatus()
    {
        var (_, token) = await CreatePlayer("dep_status_pending");
        _gateway.RHashToReturn = "hash_pending";
        _gateway.ShouldInvoiceBeSettled = false;

        Auth(token);
        await _client.PostAsJsonAsync("/api/wallet/deposit", new DepositRequest(500));
        var response = await _client.GetAsync("/api/wallet/deposit/hash_pending/status");
        ClearAuth();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<DepositStatusResponse>(JsonOpts);
        Assert.NotNull(result);
        Assert.False(result.Credited);
    }

    [Fact]
    public async Task DepositStatus_SettledInvoice_CreditsWalletAndReturnsPaid()
    {
        var (playerId, token) = await CreatePlayer("dep_status_settled");
        _gateway.RHashToReturn = "hash_settled";
        _gateway.ShouldInvoiceBeSettled = true;

        Auth(token);
        await _client.PostAsJsonAsync("/api/wallet/deposit", new DepositRequest(1000));
        var response = await _client.GetAsync("/api/wallet/deposit/hash_settled/status");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<DepositStatusResponse>(JsonOpts);
        Assert.NotNull(result);
        Assert.Equal("Paid", result.Status);
        Assert.True(result.Credited);

        // Verify wallet was credited
        var walletResp = await _client.GetAsync("/api/wallet");
        ClearAuth();
        var wallet = await walletResp.Content.ReadFromJsonAsync<WalletResponse>(JsonOpts);
        Assert.NotNull(wallet);
        Assert.True(wallet.BalanceSats > 0);
    }

    [Fact]
    public async Task DepositStatus_NotFound_Returns404()
    {
        var (_, token) = await CreatePlayer("dep_status_nf");
        Auth(token);
        var response = await _client.GetAsync("/api/wallet/deposit/nonexistent/status");
        ClearAuth();

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task DepositStatus_AlreadyCredited_DoesNotDoubleCredit()
    {
        var (playerId, token) = await CreatePlayer("dep_no_double");
        _gateway.RHashToReturn = "hash_double";
        _gateway.ShouldInvoiceBeSettled = true;

        Auth(token);
        await _client.PostAsJsonAsync("/api/wallet/deposit", new DepositRequest(1000));

        // Check once (credits wallet)
        await _client.GetAsync("/api/wallet/deposit/hash_double/status");
        var walletAfterFirst = await _client.GetAsync("/api/wallet");
        var w1 = (await walletAfterFirst.Content.ReadFromJsonAsync<WalletResponse>(JsonOpts))!;

        // Check again (should not double-credit)
        await _client.GetAsync("/api/wallet/deposit/hash_double/status");
        var walletAfterSecond = await _client.GetAsync("/api/wallet");
        var w2 = (await walletAfterSecond.Content.ReadFromJsonAsync<WalletResponse>(JsonOpts))!;
        ClearAuth();

        Assert.Equal(w1.BalanceSats, w2.BalanceSats);
    }

    [Fact]
    public async Task DepositStatus_ConcurrentStatusChecks_DoesNotDoubleCredit()
    {
        // Simulates multiple simultaneous polls from the mobile app.
        // Both requests arrive while payment is still Pending in the DB.
        // Only one should credit the wallet.
        var (playerId, token) = await CreatePlayer("dep_concurrent");
        _gateway.RHashToReturn = "hash_concurrent";
        _gateway.ShouldInvoiceBeSettled = true;

        // Initiate deposit using a dedicated client to avoid header race
        var setupClient = factory.CreateClient();
        setupClient.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", token);
        await setupClient.PostAsJsonAsync("/api/wallet/deposit", new DepositRequest(1000));

        // Fire two concurrent status-check requests
        var clientA = factory.CreateClient();
        var clientB = factory.CreateClient();
        clientA.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        clientB.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var taskA = clientA.GetAsync("/api/wallet/deposit/hash_concurrent/status");
        var taskB = clientB.GetAsync("/api/wallet/deposit/hash_concurrent/status");
        var responses = await Task.WhenAll(taskA, taskB);

        // Both responses must succeed
        Assert.All(responses, r => Assert.Equal(HttpStatusCode.OK, r.StatusCode));

        // Both must report Credited = true
        var results = await Task.WhenAll(
            responses[0].Content.ReadFromJsonAsync<DepositStatusResponse>(JsonOpts),
            responses[1].Content.ReadFromJsonAsync<DepositStatusResponse>(JsonOpts));
        Assert.All(results, r => { Assert.NotNull(r); Assert.True(r!.Credited); });

        // Wallet must be credited exactly once (1000 sats)
        var walletClient = factory.CreateClient();
        walletClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var walletResp = await walletClient.GetAsync("/api/wallet");
        var wallet = (await walletResp.Content.ReadFromJsonAsync<WalletResponse>(JsonOpts))!;
        Assert.Equal(1000, wallet.BalanceSats);
    }

    [Fact]
    public async Task DepositStatus_Settled_WalletBalanceUpdatesCorrectly()
    {
        // End-to-end: initiate → status check → wallet balance reflects credit
        var (playerId, token) = await CreatePlayer("dep_e2e");
        _gateway.RHashToReturn = "hash_e2e";
        _gateway.ShouldInvoiceBeSettled = true;

        Auth(token);
        var depositResp = await _client.PostAsJsonAsync("/api/wallet/deposit",
            new DepositRequest(2500, "test memo"));
        depositResp.EnsureSuccessStatusCode();

        var statusResp = await _client.GetAsync("/api/wallet/deposit/hash_e2e/status");
        Assert.Equal(HttpStatusCode.OK, statusResp.StatusCode);
        var status = (await statusResp.Content.ReadFromJsonAsync<DepositStatusResponse>(JsonOpts))!;
        Assert.Equal("Paid", status.Status);
        Assert.True(status.Credited);

        var walletResp = await _client.GetAsync("/api/wallet");
        ClearAuth();
        var wallet = (await walletResp.Content.ReadFromJsonAsync<WalletResponse>(JsonOpts))!;
        Assert.Equal(1000, wallet.BalanceSats); // gateway returns AmountPaidSats=1000
    }

    [Fact]
    public async Task DepositStatus_GatewayUnreachable_ReturnsPendingWithout500()
    {
        var (_, token) = await CreatePlayer("dep_gw_err");
        _gateway.RHashToReturn = "hash_gw_err";
        _gateway.ShouldGatewayFail = true;

        Auth(token);
        await _client.PostAsJsonAsync("/api/wallet/deposit", new DepositRequest(500));
        var response = await _client.GetAsync("/api/wallet/deposit/hash_gw_err/status");
        ClearAuth();

        _gateway.ShouldGatewayFail = false;

        // Should not be a 5xx — service errors return 400
        Assert.True((int)response.StatusCode < 500,
            $"Expected non-5xx but got {response.StatusCode}");
    }

    // ── POST /api/wallet/withdraw ─────────────────────────────────────────────

    [Fact]
    public async Task Withdraw_SufficientBalance_DebitsWalletAndReturnsHash()
    {
        var (playerId, token) = await CreatePlayer("withdraw_ok");
        await CreditWalletDirectly(playerId, 5000);
        _gateway.PaymentHashToReturn = "pay_hash_ok";
        _gateway.FeePaidSatsToReturn = 2;
        _gateway.ShouldPaymentFail = false;

        Auth(token);
        var response = await _client.PostAsJsonAsync("/api/wallet/withdraw",
            new WithdrawRequest("lnbcrt1_inv", 1000, 10));
        ClearAuth();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<WithdrawResponse>(JsonOpts);
        Assert.NotNull(result);
        Assert.Equal("pay_hash_ok", result.PaymentHash);
        Assert.Equal(1000, result.AmountSats);
        Assert.Equal(2, result.FeePaidSats);
    }

    [Fact]
    public async Task Withdraw_SufficientBalance_ReducesWalletBalance()
    {
        var (playerId, token) = await CreatePlayer("withdraw_debit");
        await CreditWalletDirectly(playerId, 5000);
        _gateway.FeePaidSatsToReturn = 3;
        _gateway.ShouldPaymentFail = false;

        Auth(token);
        await _client.PostAsJsonAsync("/api/wallet/withdraw",
            new WithdrawRequest("lnbcrt1_inv2", 1000, 10));
        var walletResp = await _client.GetAsync("/api/wallet");
        ClearAuth();

        var wallet = (await walletResp.Content.ReadFromJsonAsync<WalletResponse>(JsonOpts))!;
        // Platform absorbs the routing fee — user is only charged the requested amount
        Assert.Equal(5000 - 1000, wallet.BalanceSats);
    }

    [Fact]
    public async Task Withdraw_InsufficientBalance_Returns400()
    {
        var (playerId, token) = await CreatePlayer("withdraw_insuf");
        await CreditWalletDirectly(playerId, 100);

        Auth(token);
        var response = await _client.PostAsJsonAsync("/api/wallet/withdraw",
            new WithdrawRequest("lnbcrt1_inv3", 1000, 10));
        ClearAuth();

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Withdraw_FullBalance_SucceedsAndLeavesZero()
    {
        // User should be able to withdraw their entire balance; routing fee is not charged to them
        var (playerId, token) = await CreatePlayer("withdraw_full");
        await CreditWalletDirectly(playerId, 1000);
        _gateway.PaymentHashToReturn = "pay_full";
        _gateway.FeePaidSatsToReturn = 5;
        _gateway.ShouldPaymentFail = false;

        Auth(token);
        var response = await _client.PostAsJsonAsync("/api/wallet/withdraw",
            new WithdrawRequest("lnbcrt1_full", 1000, 10));
        var walletResp = await _client.GetAsync("/api/wallet");
        ClearAuth();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var wallet = (await walletResp.Content.ReadFromJsonAsync<WalletResponse>(JsonOpts))!;
        Assert.Equal(0, wallet.BalanceSats);
    }

    [Fact]
    public async Task Withdraw_GatewayFails_Returns400AndDoesNotDebitWallet()
    {
        var (playerId, token) = await CreatePlayer("withdraw_gw_fail");
        await CreditWalletDirectly(playerId, 5000);
        _gateway.ShouldPaymentFail = true;

        Auth(token);
        var response = await _client.PostAsJsonAsync("/api/wallet/withdraw",
            new WithdrawRequest("lnbcrt1_inv4", 1000, 10));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        // Balance should be unchanged
        var walletResp = await _client.GetAsync("/api/wallet");
        ClearAuth();
        var wallet = (await walletResp.Content.ReadFromJsonAsync<WalletResponse>(JsonOpts))!;
        Assert.Equal(5000, wallet.BalanceSats);

        _gateway.ShouldPaymentFail = false;
    }

    // ── Ledger after operations ───────────────────────────────────────────────

    [Fact]
    public async Task Transactions_AfterDepositAndWithdraw_ShowsAllEntries()
    {
        var (playerId, token) = await CreatePlayer("tx_history");
        await CreditWalletDirectly(playerId, 10000);
        _gateway.ShouldPaymentFail = false;
        _gateway.FeePaidSatsToReturn = 1;

        Auth(token);
        await _client.PostAsJsonAsync("/api/wallet/withdraw",
            new WithdrawRequest("lnbcrt_tx_inv", 500, 10));

        var response = await _client.GetAsync("/api/wallet/transactions");
        ClearAuth();

        var entries = (await response.Content.ReadFromJsonAsync<List<LedgerEntryResponse>>(JsonOpts))!;
        Assert.Contains(entries, e => e.Type == "Withdrawal");
    }

    // ── Game bets ─────────────────────────────────────────────────────────────

    [Fact]
    public async Task JoinGame_WithBet_LocksBetsFromBothPlayers()
    {
        var (blackId, blackToken) = await CreatePlayer("bet_lock_b");
        var (whiteId, whiteToken) = await CreatePlayer("bet_lock_w");

        await CreditWalletDirectly(blackId, 5000);
        await CreditWalletDirectly(whiteId, 5000);

        // Create game with 1000 sats bet
        Auth(blackToken);
        var createResp = await _client.PostAsJsonAsync("/api/games",
            new CreateGameRequest(1000));
        ClearAuth();
        createResp.EnsureSuccessStatusCode();
        var game = (await createResp.Content.ReadFromJsonAsync<GameResponse>(JsonOpts))!;
        Assert.Equal(1000, game.BetAmountSats);

        // White joins — both bets should be locked
        Auth(whiteToken);
        var joinResp = await _client.PostAsync($"/api/games/{game.Id}/join", null);
        ClearAuth();
        Assert.Equal(HttpStatusCode.OK, joinResp.StatusCode);

        // Check black wallet: 5000 balance, 1000 locked
        Auth(blackToken);
        var blackWallet = (await (await _client.GetAsync("/api/wallet"))
            .Content.ReadFromJsonAsync<WalletResponse>(JsonOpts))!;
        ClearAuth();

        Auth(whiteToken);
        var whiteWallet = (await (await _client.GetAsync("/api/wallet"))
            .Content.ReadFromJsonAsync<WalletResponse>(JsonOpts))!;
        ClearAuth();

        Assert.Equal(1000, blackWallet.LockedBalanceSats);
        Assert.Equal(4000, blackWallet.AvailableBalanceSats);
        Assert.Equal(1000, whiteWallet.LockedBalanceSats);
        Assert.Equal(4000, whiteWallet.AvailableBalanceSats);
    }

    [Fact]
    public async Task JoinGame_WithBet_InsufficientBalance_Returns400()
    {
        var (blackId, blackToken) = await CreatePlayer("bet_insuf_b");
        var (_, whiteToken) = await CreatePlayer("bet_insuf_w");

        await CreditWalletDirectly(blackId, 5000);
        // white has no balance

        Auth(blackToken);
        var createResp = await _client.PostAsJsonAsync("/api/games",
            new CreateGameRequest(1000));
        ClearAuth();
        var game = (await createResp.Content.ReadFromJsonAsync<GameResponse>(JsonOpts))!;

        Auth(whiteToken);
        var joinResp = await _client.PostAsync($"/api/games/{game.Id}/join", null);
        ClearAuth();

        Assert.Equal(HttpStatusCode.BadRequest, joinResp.StatusCode);
    }

    [Fact]
    public async Task JoinGame_NoBet_DoesNotLockBalance()
    {
        var (blackId, blackToken) = await CreatePlayer("nobet_b");
        var (whiteId, whiteToken) = await CreatePlayer("nobet_w");

        await CreditWalletDirectly(blackId, 1000);
        await CreditWalletDirectly(whiteId, 1000);

        Auth(blackToken);
        var createResp = await _client.PostAsJsonAsync("/api/games",
            new CreateGameRequest(0));
        ClearAuth();
        var game = (await createResp.Content.ReadFromJsonAsync<GameResponse>(JsonOpts))!;

        Auth(whiteToken);
        await _client.PostAsync($"/api/games/{game.Id}/join", null);
        ClearAuth();

        Auth(blackToken);
        var blackWallet = (await (await _client.GetAsync("/api/wallet"))
            .Content.ReadFromJsonAsync<WalletResponse>(JsonOpts))!;
        ClearAuth();

        Assert.Equal(0, blackWallet.LockedBalanceSats);
        Assert.Equal(1000, blackWallet.AvailableBalanceSats);
    }

    [Fact]
    public async Task Resign_WithBet_SettlesBetCorrectly()
    {
        var (blackId, blackToken) = await CreatePlayer("settle_resign_b");
        var (whiteId, whiteToken) = await CreatePlayer("settle_resign_w");

        await CreditWalletDirectly(blackId, 5000);
        await CreditWalletDirectly(whiteId, 5000);

        // Create & join game with 1000 sats bet
        Auth(blackToken);
        var createResp = await _client.PostAsJsonAsync("/api/games",
            new CreateGameRequest(1000));
        ClearAuth();
        var game = (await createResp.Content.ReadFromJsonAsync<GameResponse>(JsonOpts))!;

        Auth(whiteToken);
        await _client.PostAsync($"/api/games/{game.Id}/join", null);
        ClearAuth();

        // Black resigns → white wins
        Auth(blackToken);
        await _client.PostAsync($"/api/games/{game.Id}/resign", null);
        ClearAuth();

        // pot=2000, fee=100, prize=1900
        // Winner (white): LockedBalance released + receives 1900 (net: +900)
        // Loser  (black): LockedBalance forfeited (net: -1000)
        Auth(whiteToken);
        var whiteWallet = (await (await _client.GetAsync("/api/wallet"))
            .Content.ReadFromJsonAsync<WalletResponse>(JsonOpts))!;
        ClearAuth();

        Auth(blackToken);
        var blackWallet = (await (await _client.GetAsync("/api/wallet"))
            .Content.ReadFromJsonAsync<WalletResponse>(JsonOpts))!;
        ClearAuth();

        // White: 5000 - 1000 (lock) + 1900 (prize) = 5900
        Assert.Equal(5900, whiteWallet.BalanceSats);
        Assert.Equal(0, whiteWallet.LockedBalanceSats);

        // Black: 5000 - 1000 (lock forfeited) = 4000
        Assert.Equal(4000, blackWallet.BalanceSats);
        Assert.Equal(0, blackWallet.LockedBalanceSats);
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private async Task<(Guid Id, string Token)> CreatePlayer(string suffix)
    {
        var req = new RegisterRequest($"wt_{suffix}", $"wt_{suffix}@test.com");
        var regResp = await _client.PostAsJsonAsync("/api/auth/register", req);
        regResp.EnsureSuccessStatusCode();
        var body = (await regResp.Content.ReadFromJsonAsync<RegisterResponse>(JsonOpts))!;

        var confirmCode = _email.GetCode(req.Email)!;
        await _client.PostAsJsonAsync("/api/auth/confirm-email",
            new ConfirmEmailRequest(req.Email, confirmCode));

        await _client.PostAsJsonAsync("/api/auth/login", new LoginRequest(req.Email));
        var loginCode = _email.GetLoginCode(req.Email)!;
        var verifyResp = await _client.PostAsJsonAsync("/api/auth/verify-login",
            new VerifyLoginRequest(req.Email, loginCode));
        verifyResp.EnsureSuccessStatusCode();
        var loginBody = (await verifyResp.Content.ReadFromJsonAsync<LoginResponse>(JsonOpts))!;

        return (body.Id, loginBody.Token);
    }

    /// <summary>Directly insert balance into a wallet, bypassing the API.</summary>
    private async Task CreditWalletDirectly(Guid playerId, long amountSats)
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<DamasDbContext>();

        var wallet = db.Wallets.FirstOrDefault(w => w.PlayerId == playerId);
        if (wallet is null)
        {
            wallet = new Wallet
            {
                Id = Guid.NewGuid(),
                PlayerId = playerId,
                BalanceSats = amountSats,
                LockedBalanceSats = 0,
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            };
            db.Wallets.Add(wallet);
        }
        else
        {
            wallet.BalanceSats += amountSats;
            wallet.UpdatedAt = DateTimeOffset.UtcNow;
        }

        db.LedgerEntries.Add(new LedgerEntry
        {
            Id = Guid.NewGuid(),
            PlayerId = playerId,
            Type = LedgerEntryType.Deposit,
            AmountSats = amountSats,
            CreatedAt = DateTimeOffset.UtcNow
        });

        await db.SaveChangesAsync();
    }

    private void Auth(string token) =>
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

    private void ClearAuth() =>
        _client.DefaultRequestHeaders.Authorization = null;
}

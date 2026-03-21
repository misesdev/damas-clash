using api.Services;

namespace api.tests.Services;

/// <summary>
/// Unit tests for the NotificationL10n helper that maps language codes to
/// notification strings. Covers supported languages (pt, en) and the
/// fallback behaviour for unknown locales.
/// </summary>
public class NotificationL10nTests
{
    // ── Normalize ─────────────────────────────────────────────────────────────

    [Theory]
    [InlineData("pt", "pt")]
    [InlineData("en", "en")]
    [InlineData("PT", "en")]   // case-sensitive → unsupported → falls back to "en"
    [InlineData("fr", "en")]   // unsupported
    [InlineData("",   "en")]   // empty
    [InlineData(null, "en")]   // null
    public void Normalize_ReturnsExpectedLanguage(string? input, string expected) =>
        Assert.Equal(expected, NotificationL10n.Normalize(input));

    // ── Mention ───────────────────────────────────────────────────────────────

    [Fact]
    public void Mention_Portuguese_ContainsMentionedWord()
    {
        var (title, body) = NotificationL10n.Mention("pt", "alice", "hey @alice!");
        Assert.Contains("alice", title);
        Assert.Contains("mencionou", title);
        Assert.Equal("hey @alice!", body);
    }

    [Fact]
    public void Mention_English_ContainsMentionedWord()
    {
        var (title, body) = NotificationL10n.Mention("en", "alice", "hey @alice!");
        Assert.Contains("alice", title);
        Assert.Contains("mentioned", title);
        Assert.Equal("hey @alice!", body);
    }

    [Fact]
    public void Mention_UnknownLang_DefaultsToEnglish()
    {
        var (title, _) = NotificationL10n.Mention("fr", "bob", "hi");
        Assert.Contains("mentioned", title);
    }

    // ── Reply ─────────────────────────────────────────────────────────────────

    [Fact]
    public void Reply_Portuguese_ContainsRespondeu()
    {
        var (title, _) = NotificationL10n.Reply("pt", "bob", "nice move!");
        Assert.Contains("bob", title);
        Assert.Contains("respondeu", title);
    }

    [Fact]
    public void Reply_English_ContainsReplied()
    {
        var (title, _) = NotificationL10n.Reply("en", "bob", "nice move!");
        Assert.Contains("bob", title);
        Assert.Contains("replied", title);
    }

    // ── GameCreated ───────────────────────────────────────────────────────────

    [Fact]
    public void GameCreated_Portuguese_ContainsProcurando()
    {
        var (title, body) = NotificationL10n.GameCreated("pt", "carol");
        Assert.Contains("carol", title);
        Assert.Contains("procurando", title);
        Assert.Contains("partida", body);
    }

    [Fact]
    public void GameCreated_English_ContainsOpponent()
    {
        var (title, body) = NotificationL10n.GameCreated("en", "carol");
        Assert.Contains("carol", title);
        Assert.Contains("opponent", title);
        Assert.Contains("match", body);
    }

    // ── PlayerJoined ──────────────────────────────────────────────────────────

    [Fact]
    public void PlayerJoined_Portuguese_ContainsEntrou()
    {
        var (title, body) = NotificationL10n.PlayerJoined("pt", "dave");
        Assert.Contains("dave", title);
        Assert.Contains("entrou", title);
        Assert.Contains("jogar", body);
    }

    [Fact]
    public void PlayerJoined_English_ContainsJoined()
    {
        var (title, body) = NotificationL10n.PlayerJoined("en", "dave");
        Assert.Contains("dave", title);
        Assert.Contains("joined", title);
        Assert.Contains("play", body);
    }

    // ── NewUser ───────────────────────────────────────────────────────────────

    [Theory]
    [InlineData(true,  "pt", "Nostr")]
    [InlineData(false, "pt", "e-mail")]
    [InlineData(true,  "en", "Nostr")]
    [InlineData(false, "en", "e-mail")]
    public void NewUser_ContainsCorrectViaMention(bool isNostr, string lang, string expectedVia)
    {
        var (_, body) = NotificationL10n.NewUser(lang, "eve", isNostr);
        Assert.Contains(expectedVia, body);
    }

    [Fact]
    public void NewUser_Portuguese_ContainsNovo()
    {
        var (title, _) = NotificationL10n.NewUser("pt", "eve", false);
        Assert.Contains("eve", title);
        Assert.Contains("Novo", title);
    }

    [Fact]
    public void NewUser_English_ContainsNewPlayer()
    {
        var (title, _) = NotificationL10n.NewUser("en", "eve", false);
        Assert.Contains("eve", title);
        Assert.Contains("New player", title);
    }
}

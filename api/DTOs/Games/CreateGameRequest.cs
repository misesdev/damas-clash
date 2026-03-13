using System.ComponentModel.DataAnnotations;

namespace api.DTOs.Games;

public record CreateGameRequest([Range(0, long.MaxValue)] long BetAmountSats = 0);

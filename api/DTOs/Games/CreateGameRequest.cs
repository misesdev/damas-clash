using System.ComponentModel.DataAnnotations;

namespace api.DTOs.Games;

public record CreateGameRequest(
    [Range(0, 10_000_000, ErrorMessage = "BetAmountSats must be between 0 and 10,000,000.")]
    long BetAmountSats = 0);

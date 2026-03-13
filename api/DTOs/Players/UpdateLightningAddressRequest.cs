using System.ComponentModel.DataAnnotations;

namespace api.DTOs.Players;

public record UpdateLightningAddressRequest([MaxLength(320)] string? Address);

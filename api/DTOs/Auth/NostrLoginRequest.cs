using System.ComponentModel.DataAnnotations;

namespace api.DTOs.Auth;

public record NostrLoginRequest(
    [Required] string Pubkey,
    [Required] string Sig,
    [Required] string Challenge,
    string? Username,
    string? AvatarUrl,
    string? LightningAddress
);

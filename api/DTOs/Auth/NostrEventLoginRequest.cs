using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace api.DTOs.Auth;

public record NostrEventDto(
    [Required] string Id,
    [Required] string Pubkey,
    [Required][property: JsonPropertyName("created_at")] long CreatedAt,
    [Required] int Kind,
    [Required] string[][] Tags,
    [Required] string Content,
    [Required] string Sig
);

public record NostrEventLoginRequest(
    [Required] NostrEventDto Event,
    string? Username,
    string? AvatarUrl,
    string? LightningAddress
);

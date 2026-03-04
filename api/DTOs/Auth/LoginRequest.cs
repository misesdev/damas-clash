using System.ComponentModel.DataAnnotations;

namespace api.DTOs.Auth;

// Identifier can be username or email
public record LoginRequest(
    [Required] string Identifier
);

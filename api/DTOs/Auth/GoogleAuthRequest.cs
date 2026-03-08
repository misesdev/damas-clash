using System.ComponentModel.DataAnnotations;

namespace api.DTOs.Auth;

public record GoogleAuthRequest(
    [Required] string IdToken
);

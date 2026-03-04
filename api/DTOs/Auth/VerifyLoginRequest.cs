using System.ComponentModel.DataAnnotations;

namespace api.DTOs.Auth;

public record VerifyLoginRequest(
    [Required, EmailAddress] string Email,
    [Required, StringLength(6, MinimumLength = 6)] string Code
);

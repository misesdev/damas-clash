using System.ComponentModel.DataAnnotations;

namespace api.DTOs.Auth;

public record LoginRequest(
    [Required, EmailAddress] string Email,
    [Required] string Password
);

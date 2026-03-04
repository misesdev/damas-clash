using System.ComponentModel.DataAnnotations;

namespace api.DTOs.Auth;

public record RegisterRequest(
    [Required, MinLength(3), MaxLength(50)] string Username,
    [Required, EmailAddress] string Email
);

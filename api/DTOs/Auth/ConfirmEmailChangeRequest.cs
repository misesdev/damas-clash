using System.ComponentModel.DataAnnotations;

namespace api.DTOs.Auth;

public record ConfirmEmailChangeRequest(
    [Required] string NewEmail,
    [Required] string Code);

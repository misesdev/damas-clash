using System.ComponentModel.DataAnnotations;

namespace api.DTOs.Auth;

public record RequestEmailChangeRequest(
    [Required] string NewEmail);

using System.ComponentModel.DataAnnotations;

namespace api.DTOs.Players;

public record UpdateUsernameRequest(
    [Required][MinLength(3)][MaxLength(30)] string Username);

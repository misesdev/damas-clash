using System.ComponentModel.DataAnnotations;

namespace api.DTOs.Auth;

public record RefreshRequest([Required] string RefreshToken);

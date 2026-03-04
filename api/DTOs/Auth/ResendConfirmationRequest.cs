using System.ComponentModel.DataAnnotations;

namespace api.DTOs.Auth;

public record ResendConfirmationRequest([Required, EmailAddress] string Email);


using System.ComponentModel.DataAnnotations;

namespace backend.DTOs
{
    public class EmployeeRequestDto
    {
        // Shared by create and update because both accept the same fields.

        [Required(ErrorMessage = "Full name is required.")]
        [StringLength(100, MinimumLength = 2,
            ErrorMessage = "Full name must be between 2 and 100 characters.")]
        [RegularExpression(@"^[\p{L}\p{M}][\p{L}\p{M} .'-]*$",
            ErrorMessage = "Full name contains invalid characters.")]
        public string FullName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email is required.")]
        [EmailAddress(ErrorMessage = "Please enter a valid email address.")]
        [StringLength(254,
            ErrorMessage = "Email cannot exceed 254 characters.")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Department is required.")]
        [StringLength(100, MinimumLength = 2,
            ErrorMessage = "Department must be between 2 and 100 characters.")]
        public string Department { get; set; } = string.Empty;

        [Required(ErrorMessage = "Job title is required.")]
        [StringLength(100, MinimumLength = 2,
            ErrorMessage = "Job title must be between 2 and 100 characters.")]
        public string JobTitle { get; set; } = string.Empty;

        public bool IsActive { get; set; } = true;
    }
}

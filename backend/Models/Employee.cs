
using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    public class Employee
    {
        public int Id { get; set; }

        [Required(ErrorMessage = "Full name is required.")]
        public string FullName { get; set; } = string.Empty;
        

        //Since email require 2 validation rules,must exist and not same
        [Required(ErrorMessage = "Email is required.")]
        [EmailAddress(ErrorMessage = "Please enter a valid email address.")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Department is required.")]
        public string Department { get; set; } = string.Empty;

        [Required(ErrorMessage = "Job title is required.")]
        public string JobTitle { get; set; } = string.Empty;

        public bool IsActive { get; set; } = true;
    }
}

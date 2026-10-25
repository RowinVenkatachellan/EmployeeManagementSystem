using System.ComponentModel.DataAnnotations;
using backend.DTOs;
using Xunit;

namespace backend.Tests;

public class EmployeeValidationTests
{
    internal static EmployeeRequestDto ValidEmployee(string email = "jane@example.com") => new()
    {
        FullName = "Jane Doe",
        Email = email,
        Department = "Engineering",
        JobTitle = "Developer",
        IsActive = true
    };

    [Fact]
    public void ValidEmployee_PassesValidation()
    {
        var errors = new List<ValidationResult>();
        var employee = ValidEmployee();
        Assert.True(Validator.TryValidateObject(employee,
            new ValidationContext(employee), errors, true));
        Assert.Empty(errors);
    }

    public static IEnumerable<object[]> InvalidInputs()
    {
        foreach (var field in new[] { "FullName", "Email", "Department", "JobTitle" })
        {
            yield return new object[] { field, "" };
            yield return new object[] { field, "   " };
        }
        yield return new object[] { "Email", "not-an-email" };
        yield return new object[] { "Email", new string('a', 250) + "@example.com" };
        yield return new object[] { "FullName", "Jane123" };
        foreach (var field in new[] { "FullName", "Department", "JobTitle" })
        {
            yield return new object[] { field, "A" };
            yield return new object[] { field, new string('A', 101) };
        }
    }

    [Theory]
    [MemberData(nameof(InvalidInputs))]
    public void InvalidField_ReturnsAnErrorForThatField(string field, string value)
    {
        var employee = ValidEmployee();
        typeof(EmployeeRequestDto).GetProperty(field)!.SetValue(employee, value);
        var errors = new List<ValidationResult>();
        Assert.False(Validator.TryValidateObject(employee, new ValidationContext(employee), errors, true));
        Assert.Contains(errors, error => error.MemberNames.Contains(field));
    }
}

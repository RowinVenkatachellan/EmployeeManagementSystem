using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using backend.DTOs;
using Xunit;

namespace backend.Tests;

public class EmployeeApiTests
{
    private const string Url = "/api/employees";

    private static async Task<EmployeeResponseDto> CreateEmployee(HttpClient client, string email)
    {
        using var response = await client.PostAsJsonAsync(Url, EmployeeValidationTests.ValidEmployee(email));
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<EmployeeResponseDto>())!;
    }

    [Fact]
    public async Task CrudLifecycle_PersistsChangesAcrossRequests()
    {
        using var factory = new EmployeeApiFactory();
        using var client = factory.CreateEmployeeClient();

        using var emptyList = await client.GetAsync(Url);
        Assert.Equal(HttpStatusCode.OK, emptyList.StatusCode);
        Assert.Empty((await emptyList.Content.ReadFromJsonAsync<List<EmployeeResponseDto>>())!);

        var request = EmployeeValidationTests.ValidEmployee();
        using var created = await client.PostAsJsonAsync(Url, request);
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        var employee = (await created.Content.ReadFromJsonAsync<EmployeeResponseDto>())!;
        Assert.True(employee.Id > 0);
        Assert.NotNull(created.Headers.Location);
        Assert.EndsWith($"{Url}/{employee.Id}", created.Headers.Location.ToString());

        using var retrieved = await client.GetAsync(created.Headers.Location);
        Assert.Equal(HttpStatusCode.OK, retrieved.StatusCode);
        var detail = (await retrieved.Content.ReadFromJsonAsync<EmployeeResponseDto>())!;
        Assert.Equal(request.FullName, detail.FullName);
        Assert.Equal(request.Email, detail.Email);
        Assert.Equal(request.Department, detail.Department);
        Assert.Equal(request.JobTitle, detail.JobTitle);
        Assert.True(detail.IsActive);

        var list = (await client.GetFromJsonAsync<List<EmployeeResponseDto>>(Url))!;
        Assert.Equal(employee.Id, Assert.Single(list).Id);

        request.FullName = "Janet Smith";
        request.Email = "janet@example.com";
        request.Department = "Finance";
        request.JobTitle = "Accountant";
        request.IsActive = false;
        using var updated = await client.PutAsJsonAsync($"{Url}/{employee.Id}", request);
        Assert.Equal(HttpStatusCode.NoContent, updated.StatusCode);
        var saved = (await client.GetFromJsonAsync<EmployeeResponseDto>($"{Url}/{employee.Id}"))!;
        Assert.Equal(request.FullName, saved.FullName);
        Assert.Equal(request.Email, saved.Email);
        Assert.Equal(request.Department, saved.Department);
        Assert.Equal(request.JobTitle, saved.JobTitle);
        Assert.False(saved.IsActive);

        using var deleted = await client.DeleteAsync($"{Url}/{employee.Id}");
        Assert.Equal(HttpStatusCode.NoContent, deleted.StatusCode);
        using var missing = await client.GetAsync($"{Url}/{employee.Id}");
        Assert.Equal(HttpStatusCode.NotFound, missing.StatusCode);
        Assert.Empty((await client.GetFromJsonAsync<List<EmployeeResponseDto>>(Url))!);
    }

    [Theory]
    [InlineData("GET")]
    [InlineData("PUT")]
    [InlineData("DELETE")]
    public async Task MissingEmployee_Returns404(string method)
    {
        using var factory = new EmployeeApiFactory();
        using var client = factory.CreateEmployeeClient();
        using var request = new HttpRequestMessage(new HttpMethod(method), $"{Url}/999999");
        if (method == "PUT") request.Content = JsonContent.Create(EmployeeValidationTests.ValidEmployee());
        using var response = await client.SendAsync(request);
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Theory]
    [InlineData("POST")]
    [InlineData("PUT")]
    public async Task DuplicateEmail_Returns409WithoutChangingRecords(string method)
    {
        using var factory = new EmployeeApiFactory();
        using var client = factory.CreateEmployeeClient();
        var first = await CreateEmployee(client, "first@example.com");
        var second = await CreateEmployee(client, "second@example.com");
        using var request = new HttpRequestMessage(new HttpMethod(method),
            method == "POST" ? Url : $"{Url}/{second.Id}")
        {
            Content = JsonContent.Create(EmployeeValidationTests.ValidEmployee(first.Email))
        };
        using var response = await client.SendAsync(request);
        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        var error = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("An employee with this email address already exists.", error.GetProperty("message").GetString());
        var employees = (await client.GetFromJsonAsync<List<EmployeeResponseDto>>(Url))!;
        Assert.Equal(2, employees.Count);
        Assert.Equal("second@example.com", employees.Single(e => e.Id == second.Id).Email);
    }

    [Fact]
    public async Task Update_WithOwnEmail_Succeeds()
    {
        using var factory = new EmployeeApiFactory();
        using var client = factory.CreateEmployeeClient();
        var employee = await CreateEmployee(client, "jane@example.com");
        var request = EmployeeValidationTests.ValidEmployee(employee.Email);
        request.JobTitle = "Senior Developer";
        using var response = await client.PutAsJsonAsync($"{Url}/{employee.Id}", request);
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        Assert.Equal(request.JobTitle,
            (await client.GetFromJsonAsync<EmployeeResponseDto>($"{Url}/{employee.Id}"))!.JobTitle);
    }

    [Theory]
    [InlineData("POST")]
    [InlineData("PUT")]
    public async Task InvalidInput_Returns400WithFieldErrorsAndDoesNotSave(string method)
    {
        using var factory = new EmployeeApiFactory();
        using var client = factory.CreateEmployeeClient();
        var original = await CreateEmployee(client, "original@example.com");
        var invalid = EmployeeValidationTests.ValidEmployee("invalid-email");
        invalid.FullName = "";
        invalid.Department = "";
        invalid.JobTitle = "";
        using var request = new HttpRequestMessage(new HttpMethod(method),
            method == "POST" ? Url : $"{Url}/{original.Id}") { Content = JsonContent.Create(invalid) };
        using var response = await client.SendAsync(request);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        var errors = body.GetProperty("errors");
        foreach (var field in new[] { "FullName", "Email", "Department", "JobTitle" })
            Assert.True(errors.TryGetProperty(field, out _), $"Missing validation error for {field}");
        var saved = Assert.Single((await client.GetFromJsonAsync<List<EmployeeResponseDto>>(Url))!);
        Assert.Equal(original.Email, saved.Email);
        Assert.Equal(original.FullName, saved.FullName);
    }

    [Fact]
    public async Task MalformedJson_Returns400()
    {
        using var factory = new EmployeeApiFactory();
        using var client = factory.CreateEmployeeClient();
        using var response = await client.PostAsync(Url, new StringContent("{broken", Encoding.UTF8, "application/json"));
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Empty((await client.GetFromJsonAsync<List<EmployeeResponseDto>>(Url))!);
    }
}

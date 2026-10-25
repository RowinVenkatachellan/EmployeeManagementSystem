
using backend.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);
//Create an object used to configure application

// Register API controllers
builder.Services.AddControllers();

// Register CORS to allow our React frontend to access the API
builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactApp", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});//Allow react application to send http request to apis

// Register OpenAPI
builder.Services.AddOpenApi();

// Register Entity Framework Core with SQL Server
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection")
    )
);//When someone needs AppDbContext, create it with settings that tell EF Core to use our SQL Server database.

var app = builder.Build();

// Compose enables this after SQL Server reports that it is ready.
if (builder.Configuration.GetValue<bool>("Database:ApplyMigrations"))
{
    using var scope = app.Services.CreateScope();
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    context.Database.Migrate();
}

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

if (!builder.Configuration.GetValue<bool>("HttpOnly"))
{
    app.UseHttpsRedirection();
}

// Apply the React CORS policy to incoming HTTP requests
app.UseCors("ReactApp");

app.UseAuthorization();//It enforces authorization rules that we've configured.

app.MapControllers();//Map incoming requests to the appropriate controller based on the route and http method

app.Run();//Starts our ASP.NET core application

// Allows the integration tests to start this application in a test server.
public partial class Program { }

# Employee Management System

React frontend, ASP.NET Core 10 API, and SQL Server accessed through Entity Framework Core.

## Run with Docker Compose

Install Docker Desktop and select Linux containers. From the repository root:

```powershell
Copy-Item .env.example .env
```

Edit `.env` and replace the example password with your own strong password. The file is ignored by Git. Then run:

```powershell
docker compose up --build -d
docker compose ps
docker compose logs backend
```

Open http://localhost:5173. The API is also available at http://localhost:5000/api/employees.
The first run waits for SQL Server to become healthy and applies EF Core migrations automatically.
This creates a separate container database; it does not copy records from your local SQL Server.

The browser sends `/api` requests to the frontend's Nginx server, which forwards them to
`backend:8080` over the Compose network. The API uses EF Core to access `database`.
The browser uses the same origin in Docker. Local Vite development still uses the backend
at port 5000 and its existing CORS policy. Set `VITE_API_URL` to override that address.

## Check functionality and persistence

1. Create an employee through React and reload to confirm retrieval.
2. Edit the employee and confirm all changed fields and status are displayed.
3. Try missing required fields, an invalid email, and a duplicate email. Confirm errors appear.
4. Run `docker compose down`, then `docker compose up -d`. Confirm the employee remains.
5. Delete the employee and reload to confirm removal.

SQL Server data persists in the named `sqlserver-data` volume. `docker compose down -v`
deletes that database volume. Changing the password in `.env` does not update credentials
in an existing database volume; keep the original password for subsequent starts.

## Local development without Docker

Configure `ConnectionStrings:DefaultConnection` for your local SQL Server using .NET
user secrets or environment variables. Apply migrations from `backend` with
`dotnet ef database update`. Start the backend with `dotnet run --urls http://localhost:5000`.
From `frontend`, run `npm ci` and `npm run dev` (use `npm.cmd` in PowerShell if needed).

## Automated tests

From the repository root, run:

```powershell
dotnet test backend.Tests/backend.Tests.csproj --logger "trx;LogFileName=employee-tests.trx" --results-directory TestResults
```

The xUnit project includes DTO validation unit tests and HTTP integration tests using
ASP.NET Core's test server. Each API test uses an isolated, temporary SQLite database;
it does not connect to your local or Docker SQL Server database. Docker does not need
to be running for these tests.

Coverage includes the complete CRUD lifecycle, response status codes and creation Location
header, missing employees, duplicate emails on creation and update, keeping an employee's
own email during an update, invalid input, and malformed JSON. Validation unit tests cover
required fields, whitespace, email format, name characters, and field lengths.

The generated TRX report is written to `TestResults/employee-tests.trx` (ignored by Git).
These tests do not validate SQL Server-specific migrations, collation, Docker networking,
or the React interface. Use the manual checks above for the running Docker application.

See [test execution evidence](docs/test-results.md) for the recorded run.

## Day 3 progress

Docker configuration and automated xUnit/API tests are included. Complete the manual
end-to-end demonstration and prepare a review pull request for the full Day 3 submission.

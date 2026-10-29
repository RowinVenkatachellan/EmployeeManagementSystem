# Automated test execution evidence

Run date: 25 October 2026 (Indian/Mauritius).

Command executed from the repository root:

```powershell
dotnet test backend.Tests/backend.Tests.csproj --logger "trx;LogFileName=employee-tests.trx" --results-directory TestResults
```

Final result:

```text
Passed! - Failed: 0, Passed: 28, Skipped: 0, Total: 28
Duration: 12 s - backend.Tests.dll (net10.0)
```

| Coverage | Cases | Result |
| --- | ---: | --- |
| Valid DTO and invalid required fields, whitespace, email, names, and lengths | 18 | Passed |
| Create, list, retrieve by ID, update all fields/status, and delete lifecycle | 1 | Passed |
| Missing employee: GET, PUT, DELETE return 404 | 3 | Passed |
| Duplicate email: POST and PUT return 409 without changing records | 2 | Passed |
| Update retaining the employee's current email | 1 | Passed |
| Invalid POST/PUT return 400, identify fields, and preserve records | 2 | Passed |
| Malformed JSON returns 400 without saving | 1 | Passed |

The suite uses xUnit and WebApplicationFactory to send HTTP requests through ASP.NET
Core routing, JSON binding, validation, controllers, and EF Core. Each integration test
creates an isolated in-memory SQLite database and disposes it afterward. No existing
employee database is modified. SQLite creates the model using EnsureCreated; SQL Server
migrations, collation behavior, concurrent duplicate requests, browser interactions,
and Docker networking are outside this suite's coverage.

The initial run also passed all 28 tests. Its restore reported a vulnerability in the
transitive SQLite native dependency. The test project now explicitly uses
[SQLitePCLRaw.bundle_e_sqlite3 3.0.5](https://www.nuget.org/packages/SQLitePCLRaw.bundle_e_sqlite3/3.0.5),
and the final run no longer reports that SQLite warning.

Restore/build still reports the existing NU1902 and NU1903 warnings for
System.Security.Cryptography.Pkcs 9.0.4 inherited from the backend dependency tree.
These warnings did not fail the tests; backend dependency remediation remains separate work.

The full machine-readable report is generated at `TestResults/employee-tests.trx`.
That directory is ignored by Git; this document records the summary for review.

## Manual Docker check reported by the user

The user confirmed that the application starts with Compose and that a newly added
employee remains after stopping and restarting the containers. This is user-reported
manual evidence, separate from the automated run above. Complete the full browser CRUD
and validation checklist in the README before the final demonstration.

## Docker React browser verification

Verified on 25 October 2026 using headless Microsoft Edge against the running
Docker frontend at `http://localhost:5173`, including its Nginx proxy, backend,
and SQL Server database.

| Browser check | Result |
| --- | --- |
| Empty full name blocked by browser required-field validation | Passed |
| Malformed email blocked by browser email validation | Passed |
| Employee created through React; API returns 201 and row appears | Passed |
| Name, department, job title, and inactive status edited; API returns 204; changes remain after reload | Passed |
| Duplicate email returns 409 and React displays the duplicate-email message | Passed |
| Whitespace-only department returns 400 and React displays the required-field error | Passed |
| Confirmed deletion returns 204; row absent after reload; GET by ID returns 404 | Passed |

The check used a uniquely identified temporary employee and removed it afterward.
Existing employee records were not edited or deleted. A local validation screenshot
is available at `TestResults/docker-validation.png`; generated artifacts and the
one-off browser script are ignored by Git. This browser run supplements the 28
automated xUnit tests above.

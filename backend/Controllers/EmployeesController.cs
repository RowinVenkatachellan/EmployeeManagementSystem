
using Microsoft.AspNetCore.Mvc;
// Gives access to the parent class ControllerBase and API controller attributes.
// Defines which HTTP requests a method handles.

using Microsoft.EntityFrameworkCore;

using backend.Data;
// Imports the namespace for AppDbContext, allowing us to access
// the database using EF Core.

using backend.Models;
// Imports the namespace containing the Employee model class.

namespace backend.Controllers
{
    [ApiController] // Tells ASP.NET Core that this class is an API controller.
    [Route("api/employees")]
    public class EmployeesController : ControllerBase
    {
        private readonly AppDbContext _context;

        // Constructor
        public EmployeesController(AppDbContext context)
        {
            _context = context;
        }

        // Defines an API controller that handles requests sent to /api/employees.
        // Inherits from ControllerBase, giving it functionality to handle
        // HTTP requests and return responses.
        // Receives an AppDbContext object through its constructor and stores
        // it in _context, allowing its methods to interact with the employee
        // database through EF Core.


        // GET: api/employees
        [HttpGet]
        public async Task<ActionResult<List<Employee>>> GetEmployees()
        {
            var employees = await _context.Employees.ToListAsync();
            // Retrieves records from the database and converts them into a C# list.

            return Ok(employees);
        }


        // GET: api/employees/1
        [HttpGet("{id}")]
        public async Task<ActionResult<Employee>> GetEmployee(int id)
        {
            // Finds the employee using the ID from the URL.
            var employee = await _context.Employees.FindAsync(id);

            // Returns HTTP 404 if the employee does not exist.
            if (employee == null)
            {
                return NotFound();
            }

            // Returns HTTP 200 OK with the employee details.
            return Ok(employee);
        }


        // POST: api/employees
        [HttpPost]
        public async Task<ActionResult<Employee>> CreateEmployee(Employee employee)
        {
            // Removes unnecessary spaces from the email address.
            employee.Email = employee.Email.Trim();

            // Checks whether an employee with the same email already exists.
            bool emailExists = await _context.Employees
                .AnyAsync(e => e.Email == employee.Email);
            //anyAsync checks if any employee in database has same email
            
            // Returns HTTP 409 Conflict if the email is already registered.
            if (emailExists)
            {
                return Conflict(new
                {
                    message = "An employee with this email address already exists."
                });
            }

            _context.Employees.Add(employee);
            // Marks the new employee to be inserted into the database.

            await _context.SaveChangesAsync();
            // Saves the new employee to SQL Server.

            return CreatedAtAction(
                nameof(GetEmployee),
                new { id = employee.Id },
                employee
            );
            // Returns HTTP 201 Created with the newly created employee.
            // The Location header points to GET /api/employees/{id}.
        }


        // PUT: api/employees/1
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateEmployee(int id, Employee updatedEmployee)
        {
            // Finds the existing employee using the ID from the URL.
            var employee = await _context.Employees.FindAsync(id);

            // Returns HTTP 404 if the employee does not exist.
            if (employee == null)
            {
                return NotFound();
            }

            // Removes unnecessary spaces from the submitted email address.
            updatedEmployee.Email = updatedEmployee.Email.Trim();

            // Checks whether another employee already uses the submitted email.
            // Excludes the current employee to allow keeping their existing email.
            bool emailExists = await _context.Employees
                .AnyAsync(e => e.Email == updatedEmployee.Email && e.Id != id);

            // Returns HTTP 409 Conflict if another employee uses the email.
            if (emailExists)
            {
                return Conflict(new
                {
                    message = "An employee with this email address already exists."
                });
            }

            // Copies the updated details from the JSON request body
            // into the existing employee object retrieved from SQL Server.
            employee.FullName = updatedEmployee.FullName;
            employee.Email = updatedEmployee.Email;
            employee.Department = updatedEmployee.Department;
            employee.JobTitle = updatedEmployee.JobTitle;
            employee.IsActive = updatedEmployee.IsActive;

            // Saves the updated employee details to SQL Server.
            await _context.SaveChangesAsync();

            // Returns HTTP 204 No Content when the update succeeds.
            return NoContent();
        }


        // DELETE: api/employees/1
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteEmployee(int id)
        {
            // Finds the employee using the ID from the URL.
            var employee = await _context.Employees.FindAsync(id);

            // Returns HTTP 404 if the employee does not exist.
            if (employee == null)
            {
                return NotFound();
            }

            // Marks the employee for deletion.
            _context.Employees.Remove(employee);

            // Saves the deletion to SQL Server.
            await _context.SaveChangesAsync();

            // Returns HTTP 204 No Content when deletion succeeds.
            return NoContent();
        }
    }
}

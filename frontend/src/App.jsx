
import { useEffect, useState } from "react";
import "./App.css";

// Address of our ASP.NET Core backend API.
const API_URL = "http://localhost:5000/api/employees";

// Creates a fresh form with default values.
function createEmptyForm() {
  return {
    fullName: "",
    email: "",
    department: "",
    jobTitle: "",
    isActive: true,
  };
}

function App() {
  // =========================
  // 1. REACT STATE
  // =========================

  // Stores the employees retrieved from our backend.
  const [employees, setEmployees] = useState([]);

  // Stores an error message if the API request fails.
  const [error, setError] = useState("");

  // Stores a success message after creating, updating, or deleting an employee.
  const [success, setSuccess] = useState("");

  // Stores the values entered in the Add Employee form.
  const [form, setForm] = useState(createEmptyForm());

  // Stores the ID of the employee being edited.
  // null means we are adding a new employee.
  const [editingId, setEditingId] = useState(null);

  // Prevents multiple requests while saving.
  const [isSaving, setIsSaving] = useState(false);

  // Stores the ID of the employee currently being deleted.
  const [deletingId, setDeletingId] = useState(null);

  // Stores what the user types into the search bar.
  const [search, setSearch] = useState("");

  // =========================
  // 2. RETRIEVE EMPLOYEES
  // =========================

  // Retrieves the latest employee records from the backend.
  async function fetchEmployees() {
    try {
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Failed to retrieve employees.");
      }

      // Converts the JSON response into JavaScript objects.
      const data = await response.json();

      // Updates React state, causing the employee list to refresh.
      setEmployees(data);
    } catch (err) {
      setError(err.message);
    }
  }

  // Runs when the component first loads.
  // The empty [] means this effect runs on initial mount.
  useEffect(() => {
    fetchEmployees();
  }, []);

  // =========================
  // 3. HANDLE FORM INPUT
  // =========================

  // Updates the form state whenever the user changes an input.
  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((previousForm) => ({
      // Keep all existing form fields.
      ...previousForm,

      // Update only the field that the user changed.
      // Checkboxes use checked (true/false), while text inputs use value.
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  // =========================
  // 4. EDIT EMPLOYEE
  // =========================

  // Loads the selected employee's details into the form.
  function handleEdit(employee) {
    setEditingId(employee.id);

    setForm({
      fullName: employee.fullName,
      email: employee.email,
      department: employee.department,
      jobTitle: employee.jobTitle,
      isActive: employee.isActive,
    });

    setError("");
    setSuccess("");

    // Moves the user to the form at the top of the page.
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Cancels editing and switches back to Add Employee mode.
  function handleCancelEdit() {
    setEditingId(null);
    setForm(createEmptyForm());
    setError("");
    setSuccess("");
  }

  // =========================
  // 5. HANDLE API ERRORS
  // =========================

  // Extracts useful error messages from ASP.NET Core responses.
  async function getApiError(response) {
    let data;

    try {
      data = await response.json();
    } catch {
      return `Request failed with status ${response.status}.`;
    }

    // Displays validation errors returned by ASP.NET Core.
    if (data.errors) {
      const messages = Object.values(data.errors).flat();
      return messages.join(" ");
    }

    return (
      data.message ||
      data.title ||
      `Request failed with status ${response.status}.`
    );
  }

  // =========================
  // 6. ADD OR UPDATE EMPLOYEE
  // =========================

  // Sends the new employee details to our ASP.NET Core API.
  // Also updates an existing employee when editingId is not null.
  async function handleSubmit(event) {
    // Prevents the browser from refreshing the page.
    event.preventDefault();

    if (isSaving) {
      return;
    }

    setError("");
    setSuccess("");
    setIsSaving(true);

    // If editingId contains an ID, we update.
    // Otherwise, we create a new employee.
    const isEditing = editingId !== null;

    try {
      // POST creates a new employee.
      // PUT updates the employee identified by editingId.
      const url = isEditing ? `${API_URL}/${editingId}` : API_URL;
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },

        // Converts our JavaScript form object into JSON for the API.
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const message = await getApiError(response);
        throw new Error(message);
      }

      setSuccess(
        isEditing
          ? "Employee updated successfully!"
          : "Employee created successfully!"
      );

      // Clears the form after successful creation.
      // Also clears the form after a successful update.
      setForm(createEmptyForm());
      setEditingId(null);

      // Retrieves the updated employee list from SQL Server.
      await fetchEmployees();
    } catch (err) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      // Re-enables the Save button, even if the request fails.
      setIsSaving(false);
    }
  }

  // =========================
  // 7. DELETE EMPLOYEE
  // =========================

  // Deletes an employee after the user confirms.
  async function handleDelete(employee) {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${employee.fullName}?`
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");
    setDeletingId(employee.id);

    try {
      // Sends DELETE /api/employees/{id} to ASP.NET Core.
      const response = await fetch(`${API_URL}/${employee.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const message = await getApiError(response);
        throw new Error(message);
      }

      // If the deleted employee was being edited, reset the form.
      if (editingId === employee.id) {
        setEditingId(null);
        setForm(createEmptyForm());
      }

      setSuccess("Employee deleted successfully!");

      // Retrieves the updated employee list from SQL Server.
      await fetchEmployees();
    } catch (err) {
      setError(err.message || "Failed to delete employee.");
    } finally {
      setDeletingId(null);
    }
  }

  // =========================
  // 8. SEARCH EMPLOYEES
  // =========================

  // Filters employees by ID, name, email, department, or job title.
  // Searching happens in React without making another API request.
  const filteredEmployees = employees.filter((employee) => {
    const searchText = search.toLowerCase().trim();

    return (
      employee.id.toString().includes(searchText) ||
      employee.fullName.toLowerCase().includes(searchText) ||
      employee.email.toLowerCase().includes(searchText) ||
      employee.department.toLowerCase().includes(searchText) ||
      employee.jobTitle.toLowerCase().includes(searchText)
    );
  });

  // =========================
  // 9. EMPLOYEE STATISTICS
  // =========================

  // These values are calculated from employees already stored in React.
  // We do not need another API endpoint or database query.
  const totalEmployees = employees.length;

  const activeEmployees = employees.filter(
    (employee) => employee.isActive
  ).length;

  const inactiveEmployees = totalEmployees - activeEmployees;

  // =========================
  // 10. USER INTERFACE (JSX)
  // =========================

  // JSX describes what React should display on the page.
  // className connects our HTML elements to styles in App.css.
  return (
    <div className="app-container">

      {/* PAGE HEADER */}
      <header className="page-header">
        <h1>Employee Management System</h1>
        <p>Manage employee information in one place.</p>
      </header>

      {/* EMPLOYEE STATISTICS */}
      <section className="stats">
        <div className="stat-card">
          <p>Total Employees</p>
          <h2>{totalEmployees}</h2>
        </div>

        <div className="stat-card">
          <p>Active Employees</p>
          <h2>{activeEmployees}</h2>
        </div>

        <div className="stat-card">
          <p>Inactive Employees</p>
          <h2>{inactiveEmployees}</h2>
        </div>
      </section>

      {/* ADD / EDIT EMPLOYEE FORM */}
      <section className="section-card">
        <h2>
          {editingId !== null ? "Edit Employee" : "Add Employee"}
        </h2>

        {/* onSubmit calls handleSubmit when the form is submitted. */}
        <form className="employee-form" onSubmit={handleSubmit}>

          {/* FULL NAME */}
          <div className="form-group">
            <label htmlFor="fullName">Full Name</label>
            <input
              id="fullName"
              type="text"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              minLength={2}
              maxLength={100}
              pattern="[\p{L}\p{M}][\p{L}\p{M} .'-]*"
              title="Use letters, spaces, apostrophes, hyphens, or periods."
              required
            />
          </div>

          {/* EMAIL */}
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              maxLength={254}
              required
            />
          </div>

          {/* DEPARTMENT */}
          <div className="form-group">
            <label htmlFor="department">Department</label>
            <input
              id="department"
              type="text"
              name="department"
              value={form.department}
              onChange={handleChange}
              minLength={2}
              maxLength={100}
              required
            />
          </div>

          {/* JOB TITLE */}
          <div className="form-group">
            <label htmlFor="jobTitle">Job Title</label>
            <input
              id="jobTitle"
              type="text"
              name="jobTitle"
              value={form.jobTitle}
              onChange={handleChange}
              minLength={2}
              maxLength={100}
              required
            />
          </div>

          {/* ACTIVE / INACTIVE CHECKBOX */}
          <div className="checkbox-group">
            <input
              id="isActive"
              type="checkbox"
              name="isActive"
              checked={form.isActive}
              onChange={handleChange}
            />
            <label htmlFor="isActive">Active Employee</label>
          </div>

          {/* FORM BUTTONS */}
          <div className="form-actions">
            <button
              className="btn btn-primary"
              type="submit"
              disabled={isSaving || deletingId !== null}
            >
              {isSaving
                ? "Saving..."
                : editingId !== null
                  ? "Update Employee"
                  : "Add Employee"}
            </button>

            {/* Only show Cancel Edit when editing an employee. */}
            {editingId !== null && (
              <button
                className="btn btn-secondary"
                type="button"
                onClick={handleCancelEdit}
                disabled={isSaving}
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </section>

      {/* ERROR AND SUCCESS MESSAGES */}
      {error && (
        <p className="message message-error" role="alert">
          {error}
        </p>
      )}

      {success && (
        <p className="message message-success" role="status">
          {success}
        </p>
      )}

      {/* EMPLOYEE DIRECTORY */}
      <section className="section-card">
        <div className="directory-header">
          <h2>Employee Directory</h2>

          {/* Search bar for filtering employees. */}
          <input
            className="search-input"
            type="search"
            aria-label="Search employees"
            placeholder="Search by name, email, department, ID..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        {/* Displays how many employees match the search. */}
        <p className="employee-count">
          Showing {filteredEmployees.length} of {employees.length} employees
        </p>

        {/* Allows the table to scroll horizontally on small screens. */}
        <div className="table-container">
          <table className="employee-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>Department</th>
                <th>Job Title</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {/* map() creates one table row for each employee. */}
              {filteredEmployees.map((employee) => (
                <tr key={employee.id}>
                  <td>{employee.id}</td>
                  <td>{employee.fullName}</td>
                  <td>{employee.email}</td>
                  <td>{employee.department}</td>
                  <td>{employee.jobTitle}</td>

                  {/* Status badge changes colour based on isActive. */}
                  <td>
                    <span
                      className={
                        employee.isActive
                          ? "status status-active"
                          : "status status-inactive"
                      }
                    >
                      {employee.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>

                  {/* ACTION BUTTONS */}
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn btn-edit"
                        type="button"
                        onClick={() => handleEdit(employee)}
                        disabled={isSaving || deletingId !== null}
                      >
                        Edit
                      </button>

                      <button
                        className="btn btn-delete"
                        type="button"
                        onClick={() => handleDelete(employee)}
                        disabled={isSaving || deletingId !== null}
                      >
                        {deletingId === employee.id
                          ? "Deleting..."
                          : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Show a helpful message when the table is empty. */}
        {filteredEmployees.length === 0 && (
          <p className="empty-message">
            {employees.length === 0
              ? "No employees found."
              : "No employees match your search."}
          </p>
        )}
      </section>
    </div>
  );
}

export default App;

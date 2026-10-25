
import { useEffect, useState } from "react";
import "./App.css";

// Address of our ASP.NET Core backend API.
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/employees";

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

function Icon({ name }) {
  const paths = {
    people: <><circle cx="12" cy="7" r="3"/><path d="M6 21v-3a6 6 0 0 1 12 0v3ZM5 5a3 3 0 0 0 0 6M19 5a3 3 0 0 1 0 6M2 20v-3a5 5 0 0 1 3-4M22 20v-3a5 5 0 0 0-3-4"/></>,
    person: <><circle cx="12" cy="7" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2Z"/></>,
    inactive: <><circle cx="10" cy="7" r="4"/><path d="M2 21v-2a8 8 0 0 1 12-7M17 16l6 6m0-6-6 6"/></>,
    list: <path d="M8 6h13M8 12h13M8 18h13M3 6h1M3 12h1M3 18h1"/>,
    search: <><circle cx="10" cy="10" r="7"/><path d="m15 15 6 6"/></>,
    plus: <path d="M12 4v16M4 12h16"/>,
    edit: <path d="m15 4 5 5M4 16 16 4a2 2 0 0 1 4 4L8 20l-5 1Z"/>,
    trash: <path d="M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7"/>,
    arrow: <path d="m9 5 7 7-7 7"/>,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
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

    // Scroll to the form below the directory.
    document.getElementById("employee-form-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
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
    <main className="app-container">
      <div className="botanical" aria-hidden="true"><i/><i/><i/><i/></div>

      {/* PAGE HEADER */}
      <header className="page-header">
        <span className="header-icon"><Icon name="people" /></span><div><h1>Employee Management System</h1>
        <p>Manage employee information in one place.</p></div>
      </header>

      {/* EMPLOYEE STATISTICS */}
      <section className="stats">
        <div className="stat-card"><span className="stat-icon"><Icon name="people" /></span><div><p>Total Employees</p><h2>{totalEmployees}</h2></div><span className="stat-arrow"><Icon name="arrow" /></span></div>

        <div className="stat-card"><span className="stat-icon"><Icon name="person" /></span><div><p>Active Employees</p><h2>{activeEmployees}</h2></div><span className="stat-arrow"><Icon name="arrow" /></span></div>

        <div className="stat-card stat-inactive"><span className="stat-icon"><Icon name="inactive" /></span><div><p>Inactive Employees</p><h2>{inactiveEmployees}</h2></div><span className="stat-arrow"><Icon name="arrow" /></span></div>
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
          <div className="section-heading"><span className="section-icon"><Icon name="list" /></span><div><h2>Employee Directory</h2><p>Showing {filteredEmployees.length} of {employees.length} employees</p></div></div>

          {/* Search bar for filtering employees. */}
          <div className="search-wrap"><Icon name="search" /><input className="search-input"
            type="search"
            aria-label="Search employees"
            placeholder="Search by name, email, department, ID..."
            value={search}
            onChange={(event) => setSearch(event.target.value)} /></div>
        </div>



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
                        <Icon name="edit" /> Edit
                      </button>

                      <button
                        className="btn btn-delete"
                        type="button"
                        onClick={() => handleDelete(employee)}
                        disabled={isSaving || deletingId !== null}
                      >
                        <Icon name="trash" />{deletingId === employee.id
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
      {/* ADD / EDIT EMPLOYEE FORM */}
      <section className="section-card form-card" id="employee-form-section">
        <div className="section-heading"><span className="section-icon add-icon"><Icon name="plus" /></span><div><h2>
          {editingId !== null ? "Edit Employee" : "Add Employee"}
        </h2><p>{editingId !== null ? "Update the details of the selected employee." : "Fill in the details to add a new employee."}</p></div></div>

        {/* onSubmit calls handleSubmit when the form is submitted. */}
        <form className="employee-form" onSubmit={handleSubmit}>

          {/* FULL NAME */}
          <div className="form-group">
            <label htmlFor="fullName">Full Name</label>
            <input
              id="fullName" placeholder="Enter full name"
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
              id="email" placeholder="Enter email address"
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
              id="department" placeholder="Enter department"
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
              id="jobTitle" placeholder="Enter job title"
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
              <Icon name={editingId !== null ? "edit" : "plus"} />
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

    </main>
  );
}

export default App;

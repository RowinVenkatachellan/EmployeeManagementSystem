
import { useEffect, useState } from "react";

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
  // Stores the employees retrieved from our backend.
  const [employees, setEmployees] = useState([]);

  // Stores an error message if the API request fails.
  const [error, setError] = useState("");

  // Stores a success message after creating an employee.
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

  // Retrieves the latest employee records from the backend.
  async function fetchEmployees() {
    try {
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Failed to retrieve employees.");
      }

      const data = await response.json();

      setEmployees(data);
    } catch (err) {
      setError(err.message);
    }
  }

  // Runs when the component first loads.
  useEffect(() => {
    fetchEmployees();
  }, []);

  // Updates the form state whenever the user changes an input.
  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((previousForm) => ({
      ...previousForm,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

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

  // Sends the new employee details to our ASP.NET Core API.
  // Also updates an existing employee when editingId is not null.
  async function handleSubmit(event) {
    event.preventDefault();

    if (isSaving) {
      return;
    }

    setError("");
    setSuccess("");
    setIsSaving(true);

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
      setIsSaving(false);
    }
  }

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

  return (
    <div>
      <h1>Employee Management System</h1>

      <h2>{editingId !== null ? "Edit Employee" : "Add Employee"}</h2>

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="fullName">Full Name: </label>
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

        <div>
          <label htmlFor="email">Email: </label>
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

        <div>
          <label htmlFor="department">Department: </label>
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

        <div>
          <label htmlFor="jobTitle">Job Title: </label>
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

        <div>
          <label htmlFor="isActive">
            <input
              id="isActive"
              type="checkbox"
              name="isActive"
              checked={form.isActive}
              onChange={handleChange}
            />
            Active
          </label>
        </div>

        <button
          type="submit"
          disabled={isSaving || deletingId !== null}
        >
          {isSaving
            ? "Saving..."
            : editingId !== null
              ? "Update Employee"
              : "Add Employee"}
        </button>

        {editingId !== null && (
          <button
            type="button"
            onClick={handleCancelEdit}
            disabled={isSaving}
            style={{ marginLeft: "10px" }}
          >
            Cancel Edit
          </button>
        )}
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>{success}</p>}

      <h2>Employee List</h2>

      {/* Search bar for filtering employees. */}
      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Search by ID, name, email, department, or job title..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          style={{
            padding: "10px",
            width: "420px",
            maxWidth: "100%",
            borderRadius: "6px",
            border: "1px solid #ccc",
          }}
        />
      </div>

      {/* Displays how many employees match the search. */}
      <p>
        Showing {filteredEmployees.length} of {employees.length} employees
      </p>

      <table border="1" cellPadding="10">
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
          {filteredEmployees.map((employee) => (
            <tr key={employee.id}>
              <td>{employee.id}</td>
              <td>{employee.fullName}</td>
              <td>{employee.email}</td>
              <td>{employee.department}</td>
              <td>{employee.jobTitle}</td>
              <td>{employee.isActive ? "Active" : "Inactive"}</td>
              <td>
                <button
                  type="button"
                  onClick={() => handleEdit(employee)}
                  disabled={isSaving || deletingId !== null}
                >
                  Edit
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(employee)}
                  disabled={isSaving || deletingId !== null}
                  style={{ marginLeft: "10px" }}
                >
                  {deletingId === employee.id
                    ? "Deleting..."
                    : "Delete"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {filteredEmployees.length === 0 && (
        <p>
          {employees.length === 0
            ? "No employees found."
            : "No employees match your search."}
        </p>
      )}
    </div>
  );
}

export default App;

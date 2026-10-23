
import { useEffect, useState } from "react";

function App() {
  // Stores the employees retrieved from our backend.
  const [employees, setEmployees] = useState([]);

  // Stores an error message if the API request fails.
  const [error, setError] = useState("");

  // Runs when the component first loads.
  useEffect(() => {
    async function fetchEmployees() {
      try {
        // Sends a GET request to our ASP.NET Core API.
        const response = await fetch("http://localhost:5000/api/employees");

        // Checks whether the HTTP request succeeded.
        if (!response.ok) {
          throw new Error("Failed to retrieve employees.");
        }

        // Converts the JSON response into JavaScript data.
        const data = await response.json();

        // Updates the employees state.
        setEmployees(data);
      } catch (err) {
        setError(err.message);
      }
    }

    fetchEmployees();
  }, []);

  return (
    <div>
      <h1>Employee Management System</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <h2>Employee List</h2>

      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>ID</th>
            <th>Full Name</th>
            <th>Email</th>
            <th>Department</th>
            <th>Job Title</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {employees.map((employee) => (
            <tr key={employee.id}>
              <td>{employee.id}</td>
              <td>{employee.fullName}</td>
              <td>{employee.email}</td>
              <td>{employee.department}</td>
              <td>{employee.jobTitle}</td>
              <td>{employee.isActive ? "Active" : "Inactive"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;

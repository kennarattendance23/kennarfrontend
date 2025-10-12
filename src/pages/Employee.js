import React, { useEffect, useState } from "react";
import axios from "axios";
import "../Employee.css";

const API_BASE = "http://localhost:5000"; // change if deployed

const Employee = () => {
  const [employees, setEmployees] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/employees`);
      setEmployees(res.data);
    } catch (err) {
      console.error("Error fetching employees:", err);
    }
  };

  const confirmDelete = (employee) => {
    setEmployeeToDelete(employee);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!employeeToDelete) return;
    try {
      await axios.delete(`${API_BASE}/api/employees/${employeeToDelete.employee_id}`);
      await fetchEmployees();
    } catch (err) {
      console.error("❌ Error deleting employee:", err);
    } finally {
      setShowDeleteModal(false);
      setEmployeeToDelete(null);
    }
  };

  return (
    <div className="employee-container">
      <h2>Employee List</h2>
      <table className="employee-table">
        <thead>
          <tr>
            <th>Employee ID</th>
            <th>Name</th>
            <th>Mobile</th>
            <th>DOB</th>
            <th>Image</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => (
            <tr key={emp.employee_id}>
              <td>{emp.employee_id}</td>
              <td>{emp.name}</td>
              <td>{emp.mobile_phone}</td>
              <td>{emp.date_of_birth}</td>
              <td>
                {emp.image ? (
                  <img src={emp.image} alt={emp.name} width="50" />
                ) : (
                  "No Image"
                )}
              </td>
              <td>
                <button
                  className="delete-btn"
                  onClick={() => confirmDelete(emp)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="modal">
          <div className="modal-content">
            <p>
              Are you sure you want to delete{" "}
              <strong>{employeeToDelete?.name}</strong>?
            </p>
            <button onClick={handleDelete}>Yes, Delete</button>
            <button onClick={() => setShowDeleteModal(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employee;

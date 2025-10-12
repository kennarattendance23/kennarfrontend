// === src/pages/Employee.js ===
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import "../Employee.css";

// ✅ Use deployed API instead of localhost
const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "https://kennarbackend.onrender.com/api";
const UPLOADS_BASE_URL =
  process.env.REACT_APP_UPLOADS_BASE_URL || "https://kennarbackend.onrender.com/uploads";

const Employee = () => {
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    employee_id: "",
    name: "",
    position: "",
    contact: "",
    address: "",
    image: "",
  });
  const [preview, setPreview] = useState(null);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const fileInputRef = useRef(null);

  // ✅ Fetch employees
  const fetchEmployees = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/employees`);
      setEmployees(res.data);
    } catch (err) {
      console.error("❌ Error fetching employees:", err);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // ✅ Handle form input
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image" && files.length > 0) {
      setFormData({ ...formData, image: files[0] });
      setPreview(URL.createObjectURL(files[0]));
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // ✅ Submit form (Add / Update)
  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = new FormData();
    Object.keys(formData).forEach((key) => {
      if (formData[key]) data.append(key, formData[key]);
    });

    try {
      if (formData.employee_id) {
        await axios.put(`${API_BASE_URL}/employees/${formData.employee_id}`, data);
        alert("✅ Employee updated");
      } else {
        await axios.post(`${API_BASE_URL}/employees`, data);
        alert("✅ Employee added");
      }
      setFormData({ employee_id: "", name: "", position: "", contact: "", address: "", image: "" });
      setPreview(null);
      fileInputRef.current.value = null;
      fetchEmployees();
    } catch (err) {
      console.error("❌ Error saving employee:", err);
    }
  };

  // ✅ Edit employee
  const handleEdit = (emp) => {
    setFormData(emp);
    setPreview(emp.image ? `${UPLOADS_BASE_URL}/${emp.image}` : null);
  };

  // ✅ Delete employee
  const handleDelete = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/employees/${employeeToDelete.employee_id}`);
      alert("🗑️ Employee deleted");
      setEmployeeToDelete(null);
      fetchEmployees();
    } catch (err) {
      console.error("❌ Error deleting employee:", err);
    }
  };

  return (
    <div className="employee-container">
      <h2>Employee Management</h2>

      {/* 🔍 Search */}
      <input
        type="text"
        placeholder="Search employee..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="search-input"
      />

      {/* 📝 Employee Form */}
      <form onSubmit={handleSubmit} className="employee-form">
        <input
          type="text"
          name="name"
          placeholder="Full Name"
          value={formData.name}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="position"
          placeholder="Position"
          value={formData.position}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="contact"
          placeholder="Contact"
          value={formData.contact}
          onChange={handleChange}
        />
        <input
          type="text"
          name="address"
          placeholder="Address"
          value={formData.address}
          onChange={handleChange}
        />
        <input
          type="file"
          name="image"
          accept="image/*"
          onChange={handleChange}
          ref={fileInputRef}
        />

        {preview && <img src={preview} alt="Preview" className="preview-img" />}

        <button type="submit">{formData.employee_id ? "Update" : "Add"} Employee</button>
        {formData.employee_id && (
          <button
            type="button"
            onClick={() => {
              setFormData({
                employee_id: "",
                name: "",
                position: "",
                contact: "",
                address: "",
                image: "",
              });
              setPreview(null);
              fileInputRef.current.value = null;
            }}
          >
            Cancel
          </button>
        )}
      </form>

      {/* 📋 Employee Table */}
      <table className="employee-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Photo</th>
            <th>Name</th>
            <th>Position</th>
            <th>Contact</th>
            <th>Address</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {employees
            .filter((emp) =>
              emp.name.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map((emp) => (
              <tr key={emp.employee_id}>
                <td>{emp.employee_id}</td>
                <td>
                  {emp.image ? (
                    <img
                      src={`${UPLOADS_BASE_URL}/${emp.image}`}
                      alt="employee"
                      width="50"
                      height="50"
                    />
                  ) : (
                    "No Image"
                  )}
                </td>
                <td>{emp.name}</td>
                <td>{emp.position}</td>
                <td>{emp.contact}</td>
                <td>{emp.address}</td>
                <td>
                  <button onClick={() => handleEdit(emp)}>Edit</button>
                  <button onClick={() => setEmployeeToDelete(emp)}>Delete</button>
                </td>
              </tr>
            ))}
        </tbody>
      </table>

      {/* 🗑️ Delete Confirmation */}
      {employeeToDelete && (
        <div className="modal">
          <p>Are you sure you want to delete {employeeToDelete.name}?</p>
          <button onClick={handleDelete}>Yes</button>
          <button onClick={() => setEmployeeToDelete(null)}>No</button>
        </div>
      )}
    </div>
  );
};

export default Employee;

import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import "../Employee.css";

const Employee = () => {
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    employee_id: "",
    name: "",
    mobile_phone: "",
    date_of_birth: "",
    status: "",
    image: null,
    face_embedding: "",
    fingerprint_id: "",
  });

  const [isRegistering, setIsRegistering] = useState(false);
  const fileInputRef = useRef(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);

  const [showUpdateModal, setShowUpdateModal] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const employeesPerPage = 5;

  const API_BASE = process.env.REACT_APP_API_URL || "https://kennarbackend.onrender.com";

  const fetchEmployees = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/employees`);
      setEmployees(res.data);
    } catch (err) {
      console.error("Error fetching employees:", err);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image") {
      setFormData((prev) => ({ ...prev, image: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const resetForm = () => {
    setFormData({
      employee_id: "",
      name: "",
      mobile_phone: "",
      date_of_birth: "",
      status: "",
      image: null,
      face_embedding: "",
      fingerprint_id: "",
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
    setShowUpdateModal(false);
    setIsRegistering(false);
  };

  const handleSubmitConfirmed = async () => {
    setIsRegistering(true);
    try {
      const form = new FormData();
      Object.keys(formData).forEach((key) => {
        if (formData[key] !== null && formData[key] !== undefined) {
          form.append(key, formData[key]);
        }
      });

      const isEditing = employees.some((emp) => emp.employee_id === formData.employee_id);

      if (isEditing) {
        await axios.put(`${API_BASE}/api/employees/${formData.employee_id}`, form);
      } else {
        await axios.post(`${API_BASE}/api/employees`, form);
      }

      resetForm();
      await fetchEmployees();
    } catch (err) {
      console.error("Error saving employee:", err);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleProceedRegistration = async (employeeId) => {
    // Check employee ID
    if (!employeeId) {
      alert("Employee ID is required.");
      return;
    }

    // Ensure all other fields are filled
    const requiredFields = ["name", "mobile_phone", "date_of_birth", "status"];
    for (let field of requiredFields) {
      if (!formData[field]) {
        alert(`Please fill the ${field.replace("_", " ")} before proceeding.`);
        return;
      }
    }

    // Only allow registration if face_embedding and fingerprint_id are blank
    if (formData.face_embedding || formData.fingerprint_id) {
      alert("This employee is already registered.");
      return;
    }

    setIsRegistering(true);

    try {
      const res = await axios.post(`${API_BASE}/api/register/${employeeId}`);
      alert(res.data.message);

      resetForm();
      await fetchEmployees();
    } catch (err) {
      console.error("❌ Registration failed:", err);
      alert("Failed to start registration on kiosk");
    } finally {
      setIsRegistering(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const isEditing = formData.employee_id && employees.some((emp) => emp.employee_id === formData.employee_id);
    if (isEditing) {
      setShowUpdateModal(true);
    } else {
      handleSubmitConfirmed();
    }
  };

  const confirmDelete = (emp) => {
    setEmployeeToDelete(emp);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!employeeToDelete) return;
    try {
      await axios.delete(`${API_BASE}/api/employees/${employeeToDelete.id}`);
      await fetchEmployees();
    } catch (err) {
      console.error("Error deleting employee:", err);
    } finally {
      setShowDeleteModal(false);
      setEmployeeToDelete(null);
    }
  };

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.employee_id?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.mobile_phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.status?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages =
    filteredEmployees.length === 0 ? 0 : Math.ceil(filteredEmployees.length / employeesPerPage);

  useEffect(() => {
    if (filteredEmployees.length === 0) {
      setCurrentPage(1);
    } else {
      const pages = Math.ceil(filteredEmployees.length / employeesPerPage);
      if (currentPage > pages) setCurrentPage(pages);
    }
  }, [filteredEmployees.length, employeesPerPage, currentPage]);

  const indexOfLastEmployee = currentPage * employeesPerPage;
  const indexOfFirstEmployee = indexOfLastEmployee - employeesPerPage;
  const currentEmployees =
    filteredEmployees.length === 0
      ? []
      : filteredEmployees.slice(indexOfFirstEmployee, indexOfLastEmployee);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((p) => p + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage((p) => p - 1);
  };

  return (
    <div className="employee-scroll" id="employeeScroll">
      <div className="employee-container">
        <h3 className="employee-header">Employee Management</h3>

        <div className="employee-search">
          <input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <form className="employee-form" onSubmit={handleSubmit}>
          {/* Input fields */}
          <div className="employee-form-group">
            <label>Employee ID</label>
            <input type="text" name="employee_id" value={formData.employee_id} onChange={handleInputChange} />
          </div>
          <div className="employee-form-group">
            <label>Name</label>
            <input type="text" name="name" value={formData.name} onChange={handleInputChange} />
          </div>
          <div className="employee-form-group">
            <label>Mobile Phone</label>
            <input type="text" name="mobile_phone" value={formData.mobile_phone} onChange={handleInputChange} />
          </div>
          <div className="employee-form-group">
            <label>Status</label>
            <select name="status" value={formData.status} onChange={handleInputChange}>
              <option value="">Select Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <div className="employee-form-group">
            <label>Image</label>
            <input type="file" name="image" onChange={handleInputChange} ref={fileInputRef} />
          </div>
          <div className="employee-form-group">
            <label>Date of Birth</label>
            <input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleInputChange} />
          </div>
          <div className="employee-form-group">
            <label>Face Embedding</label>
            <input type="text" name="face_embedding" value={formData.face_embedding} readOnly />
          </div>
          <div className="employee-form-group">
            <label>Fingerprint ID</label>
            <input type="text" name="fingerprint_id" value={formData.fingerprint_id} readOnly />
          </div>

          {/* Buttons */}
          <div className="employee-form-group button-group">
            {formData.employee_id && employees.some((emp) => emp.employee_id === formData.employee_id) ? (
              <button type="submit" className="update-button">
                Update
              </button>
            ) : (
              <button
                type="button"
                className="proceed-button"
                disabled={isRegistering}
                onClick={() => handleProceedRegistration(formData.employee_id)}
              >
                {isRegistering ? "Registering..." : "Proceed"}
              </button>
            )}
          </div>
        </form>

        {/* Employee Table */}
        <table className="employee-table">
          <thead>
            <tr>
              <th>EMPLOYEE ID</th>
              <th>IMAGE</th>
              <th>NAME</th>
              <th>DATE OF BIRTH</th>
              <th>MOBILE PHONE</th>
              <th>STATUS</th>
              <th>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {currentEmployees.length > 0 ? (
              currentEmployees.map((emp) => (
                <tr key={emp.employee_id}>
                  <td>{emp.employee_id}</td>
                  <td>{emp.image ? <img src={`${API_BASE}/uploads/${emp.image}`} alt="employee" width="50" /> : "No Image"}</td>
                  <td>{emp.name}</td>
                  <td>{emp.date_of_birth ? new Date(emp.date_of_birth).toLocaleDateString("en-CA") : "N/A"}</td>
                  <td>{emp.mobile_phone}</td>
                  <td>{emp.status}</td>
                  <td className="employee-actions">
                    <button
                      className="edit-btn"
                      onClick={() =>
                        setFormData({
                          employee_id: emp.employee_id,
                          name: emp.name,
                          mobile_phone: emp.mobile_phone,
                          date_of_birth: emp.date_of_birth ? new Date(emp.date_of_birth).toISOString().split("T")[0] : "",
                          status: emp.status,
                          image: null,
                          face_embedding: emp.face_embedding || "",
                          fingerprint_id: emp.fingerprint_id || "",
                        })
                      }
                    >
                      EDIT
                    </button>
                    <br />
                    <button className="delete-btn" onClick={() => confirmDelete(emp)}>
                      DELETE
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7">No employees found.</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="pagination">
          <div className="pagination-info">
            {filteredEmployees.length === 0 ? "Showing 0 of 0" : `Showing ${currentPage} of ${totalPages}`}
          </div>
          <div className="pagination-controls">
            <button className="pagination-btn" onClick={handlePrevPage} disabled={filteredEmployees.length === 0 || currentPage === 1}>
              Previous
            </button>
            <span className="pagination-page">{filteredEmployees.length === 0 ? 0 : currentPage}</span>
            <button className="pagination-btn" onClick={handleNextPage} disabled={filteredEmployees.length === 0 || currentPage === totalPages}>
              Next
            </button>
          </div>
        </div>

        {/* Modals */}
        {showUpdateModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Confirm Update</h3>
              <p>Are you sure you want to save changes?</p>
              <div className="modal-actions">
                <button className="cancel-button" onClick={() => setShowUpdateModal(false)}>
                  Cancel
                </button>
                <button className="update-button" onClick={handleSubmitConfirmed}>
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {showDeleteModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Confirm Delete</h3>
              <p>
                Are you sure you want to delete <strong>{employeeToDelete?.name}</strong>?
              </p>
              <div className="modal-actions">
                <button className="cancel-button" onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </button>
                <button className="delete-btn" onClick={handleDelete}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Employee;

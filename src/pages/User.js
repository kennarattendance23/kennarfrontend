import React, { useState } from 'react';
import axios from 'axios';
import '../User.css';

function User() {
  const [form, setForm] = useState({
    employee_id: '',
    admin_name: '',
    username: '',
    position: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const API_URL = 'https://kennarbackend.onrender.com/api/admins';

  const addUser = async () => {
    const { employee_id, admin_name, username, position } = form;

    if (!employee_id || !admin_name || !username || !position) {
      setError('All fields are required');
      setSuccess('');
      return;
    }

    try {
      await axios.post(API_URL, form);

      setForm({
        employee_id: '',
        admin_name: '',
        username: '',
        position: ''
      });

      setError('');
      setSuccess('User created. One-time password has been emailed.');
    } catch (err) {
      if (err.response?.status === 409) {
        setError('Email already exists');
      } else {
        setError('Failed to add user');
      }
      setSuccess('');
    }
  };

  return (
    <div className="user-scroll-wrapper">
      <div className="user-container">
        <h3 className="user-titleheader">User Account Management</h3>

        <div className="user-form">
          <div className="form-grid">

            <div className="form-group">
              <label>Employee ID</label>
              <input
                placeholder="Employee ID"
                value={form.employee_id}
                onChange={(e) =>
                  setForm({ ...form, employee_id: e.target.value })
                }
              />
            </div>

            <div className="form-group">
              <label>Name</label>
              <input
                placeholder="Full Name"
                value={form.admin_name}
                onChange={(e) =>
                  setForm({ ...form, admin_name: e.target.value })
                }
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                placeholder="Email"
                value={form.username}
                onChange={(e) =>
                  setForm({ ...form, username: e.target.value })
                }
              />
            </div>

            <div className="form-group">
              <label>Position</label>
              <select
                className="form-control"
                value={form.position}
                onChange={(e) =>
                  setForm({ ...form, position: e.target.value })
                }
              >
                <option value="">Select position</option>
                <option value="admin">Admin</option>
                <option value="employee">Employee</option>
              </select>
            </div>

          </div>

          <button onClick={addUser} className="add-user-btn">
            Save
          </button>

          {error && <p className="error-message">{error}</p>}
          {success && <p className="success-message">{success}</p>}
        </div>
      </div>
    </div>
  );
}

export default User;

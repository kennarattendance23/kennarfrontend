import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../User.css';

function User() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    employee_id: '',
    admin_name: '',
    username: '',
    role: 'employee'
  });
  const [error, setError] = useState('');

  const API_URL = "https://kennarbackend.onrender.com/api/admins";

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = () => {
    axios
      .get(API_URL)
      .then((res) => setUsers(res.data))
      .catch((err) => console.error(err));
  };

  const addUser = () => {
    const { employee_id, admin_name, username, role } = form;

    if (!employee_id || !admin_name || !username || !role) {
      setError('All fields are required');
      return;
    }

    axios
      .post(API_URL, form)
      .then((res) => {
        setUsers((prev) => [...prev, res.data]);
        setForm({
          employee_id: '',
          admin_name: '',
          username: '',
          role: 'employee'
        });
        setError('');
      })
      .catch((err) => {
        if (err.response?.status === 409) {
          setError('Username already exists');
        } else {
          setError('Failed to add user');
        }
      });
  };

  const deleteUser = (id) => {
    axios
      .delete(`${API_URL}/${id}`)
      .then(() => {
        setUsers(users.filter((u) => u.id !== id));
      })
      .catch((err) => console.error(err));
  };

  return (
    <div className="user-scroll-wrapper">
      <div className="user-container">
        <h3 className="user-titleheader">User Account Management</h3>

        {/* SEARCH BAR REMOVED */}

        <div className="user-form">
          <div className="form-grid">

            <div className="form-group">
              <label>Employee ID</label>
              <input
                value={form.employee_id}
                onChange={(e) =>
                  setForm({ ...form, employee_id: e.target.value })
                }
              />
            </div>

            <div className="form-group">
              <label>Full Name</label>
              <input
                value={form.admin_name}
                onChange={(e) =>
                  setForm({ ...form, admin_name: e.target.value })
                }
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                value={form.username}
                onChange={(e) =>
                  setForm({ ...form, username: e.target.value })
                }
              />
            </div>

            <div className="form-group">
              <label>Role</label>
              <select
                value={form.role}
                onChange={(e) =>
                  setForm({ ...form, role: e.target.value })
                }
              >
                <option value="admin">Admin</option>
                <option value="employee">Employee</option>
              </select>
            </div>

          </div>

          <button onClick={addUser} className="add-user-btn">
            Add User
          </button>

          {error && <p className="error-message">{error}</p>}
        </div>

        {/* USER LIST */}
        <table className="user-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Employee ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.employee_id}</td>
                <td>{u.admin_name}</td>
                <td>{u.username}</td>
                <td>{u.role}</td>
                <td>
                  <button
                    className="delete-btn"
                    onClick={() => deleteUser(u.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

      </div>
    </div>
  );
}

export default User;

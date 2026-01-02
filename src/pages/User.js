import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../User.css';

function User() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    employee_id: '',
    admin_name: '',
    email: ''
  });
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

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
    const { employee_id, admin_name, email } = form;

    if (!employee_id || !admin_name || !email) {
      setError('All fields are required');
      return;
    }

    axios
      .post(API_URL, form)
      .then((res) => {
        setUsers((prev) => [...prev, res.data]);
        setForm({ employee_id: '', admin_name: '', email: '' });
        setError('');
        alert('Account created. Default password sent via email.');
      })
      .catch((err) => {
        if (err.response?.status === 409)
          setError('Email already exists');
        else
          setError('Failed to add user');
      });
  };

  const filteredUsers = users.filter((user) =>
    Object.values(user).some((val) =>
      String(val).toLowerCase().includes(search.toLowerCase())
    )
  );

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="user-scroll-wrapper">
      <div className="user-container">
        <h3 className="user-titleheader">User Account Management</h3>

        <div className="user-header">
          <input
            placeholder="Search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

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
                placeholder="Email Address"
                value={form.email}
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
              />
            </div>

          </div>

          <button onClick={addUser} className="add-user-btn">
            Add User
          </button>

          {error && <p className="error-message">{error}</p>}
        </div>

        <table className="user-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Employee ID</th>
              <th>Name</th>
              <th>Email</th>
            </tr>
          </thead>
          <tbody>
            {currentUsers.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.employee_id}</td>
                <td>{user.admin_name}</td>
                <td>{user.username}</td>
              </tr>
            ))}
          </tbody>
        </table>

      </div>
    </div>
  );
}

export default User;

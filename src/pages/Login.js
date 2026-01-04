import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../Login.css';

function Login({ onLoginChange }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('https://kennarbackend.onrender.com/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (data.success) {
        // Save user info
        localStorage.setItem('user', JSON.stringify({
          username,
          admin_name: data.admin_name,
          employee_id: data.employee_id,
          role: data.role
        }));

        if (onLoginChange) {
          onLoginChange({
            admin_name: data.admin_name,
            employee_id: data.employee_id,
            role: data.role
          });
        }

        // Redirect based on role
        if (data.role === 'admin') {
          navigate('/dashboard');
        } else if (data.role === 'employee') {
          navigate('/employee-portal');
        } else {
          setError("Unknown role");
        }
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Error logging in: ' + err.message);
    }
  };

  return (
    <div className="app-bg">
      <div className="login-box">
        <h2>Login</h2>
        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          /><br />

          <div className="password-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="toggle-password-login"
              onClick={() => setShowPassword(!showPassword)}
            >
              <i className={`fa-solid ${showPassword ? 'fa-eye' : 'fa-eye-slash'}`}></i>
            </button>
          </div>

          <button type="submit" className="login-btn">Login</button>
        </form>

        {error && <p className="error-message">{error}</p>}
      </div>
    </div>
  );
}

export default Login;

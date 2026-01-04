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
    setError(''); // clear previous errors

    try {
      const res = await fetch('https://kennarbackend.onrender.com/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      console.log("Login response from backend:", data); // DEBUG

      if (data.success) {
        // Normalize role: trim spaces and lowercase
        const role = data.role?.trim().toLowerCase();

        // Save user info in localStorage
        localStorage.setItem('user', JSON.stringify({
          username,
          admin_name: data.admin_name,
          employee_id: data.employee_id,
          role
        }));

        if (onLoginChange) {
          onLoginChange({
            admin_name: data.admin_name,
            employee_id: data.employee_id,
            role
          });
        }

        // Redirect based on role
        if (role === 'admin') {
          navigate('/dashboard');
        } else if (role === 'employee') {
          navigate('/employee-portal');
        } else {
          console.error("Unknown role received from backend:", data.role);
          setError("Unknown role received. Contact admin.");
        }
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      console.error("Login fetch error:", err);
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
            placeholder="Username or Email"
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

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
    setError('');

    try {
      const res = await fetch('https://kennarbackend.onrender.com/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      console.log("LOGIN RESPONSE:", data);

      if (!data.success) {
        setError(data.message || 'Login failed');
        return;
      }

      // ✅ FORCE role normalization AGAIN (double safety)
      const role = String(data.role).trim().toLowerCase();

      console.log("FINAL ROLE USED:", role);

      // 🔥 CLEAR OLD SESSION (THIS IS CRITICAL)
      localStorage.removeItem('user');

      const userData = {
        username,
        admin_name: data.admin_name,
        employee_id: data.employee_id,
        role
      };

      localStorage.setItem('user', JSON.stringify(userData));

      if (onLoginChange) {
        onLoginChange(userData);
      }

      // ✅ ONLY redirect here
      if (role === 'admin') {
        navigate('/dashboard', { replace: true });
      } else if (role === 'employee') {
        navigate('/employee-portal', { replace: true });
      } else {
        setError("Invalid role assigned to account");
      }

    } catch (err) {
      console.error("LOGIN FETCH ERROR:", err);
      setError("Server error. Try again.");
    }
  };

  return (
    <div className="app-bg">
      <div className="login-box">
        <h2>Login</h2>

        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Email"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <div className="password-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
            >
              👁
            </button>
          </div>

          <button type="submit">Login</button>
        </form>

        {error && <p className="error-message">{error}</p>}
      </div>
    </div>
  );
}

export default Login;

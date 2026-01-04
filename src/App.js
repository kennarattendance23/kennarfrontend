import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';

import Sidebar from './pages/Sidebar';
import Employee from './pages/Employee';
import Dashboard from './pages/Dashboard';
import User from './pages/User';
import Report from './pages/Report';
import Login from './pages/Login';
import Summary from './pages/Summary';
import EmployeePortal from './pages/EmployeePortal';
import './App.css';

const AppWrapper = () => {
  const location = useLocation();

  const [user, setUser] = useState(
    localStorage.getItem('admins')
      ? JSON.parse(localStorage.getItem('admins'))
      : null
  );

  useEffect(() => {
    const logoutHandler = () => {
      setUser(null);
      localStorage.removeItem('admins');
    };

    window.addEventListener('logout', logoutHandler);
    return () => window.removeEventListener('logout', logoutHandler);
  }, []);

  const onLoginChange = (userData) => {
    if (userData) {
      const normalizedUser = {
        ...userData,
        role: String(userData.role).trim().toLowerCase()
      };

      setUser(normalizedUser);
      localStorage.setItem('admins', JSON.stringify(normalizedUser));
    } else {
      setUser(null);
      localStorage.removeItem('admins');
    }
  };

  const isLoginPage = location.pathname === '/login';

  return (
    <div className="app-layout" style={{ display: 'flex' }}>
      {/* Sidebar ONLY for admin */}
      {!isLoginPage && user?.role === 'admin' && (
        <Sidebar admin_name={user.admin_name} />
      )}

      <div className="main-content" style={{ flex: 1, padding: '20px' }}>
        <Routes>

          {/* Root */}
          <Route
            path="/"
            element={
              user
                ? user.role === 'admin'
                  ? <Navigate to="/dashboard" replace />
                  : <Navigate to="/employee-portal" replace />
                : <Navigate to="/login" replace />
            }
          />

          <Route path="/login" element={<Login onLoginChange={onLoginChange} />} />

          {/* ADMIN ROUTES */}
          <Route
            path="/dashboard"
            element={
              user?.role === 'admin'
                ? <Dashboard />
                : <Navigate to="/employee-portal" replace />
            }
          />

          <Route
            path="/employee"
            element={
              user?.role === 'admin'
                ? <Employee />
                : <Navigate to="/employee-portal" replace />
            }
          />

          <Route
            path="/user"
            element={
              user?.role === 'admin'
                ? <User />
                : <Navigate to="/employee-portal" replace />
            }
          />

          <Route
            path="/report"
            element={
              user?.role === 'admin'
                ? <Report />
                : <Navigate to="/employee-portal" replace />
            }
          />

          <Route
            path="/summary"
            element={
              user?.role === 'admin'
                ? <Summary />
                : <Navigate to="/employee-portal" replace />
            }
          />

          {/* EMPLOYEE ROUTE */}
          <Route
            path="/employee-portal"
            element={
              user?.role === 'employee'
                ? <EmployeePortal />
                : <Navigate to="/dashboard" replace />
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
};

const App = () => (
  <Router>
    <AppWrapper />
  </Router>
);

export default App;

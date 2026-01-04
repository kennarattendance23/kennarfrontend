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

  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem('admins')
  );
  const [admin_name, setAdminName] = useState(
    localStorage.getItem('admins') ? JSON.parse(localStorage.getItem('admins')).admin_name : null
  );

  useEffect(() => {
    const logoutHandler = () => {
      setIsLoggedIn(false);
      setAdminName(null);
      localStorage.removeItem('admins'); 
    };

    window.addEventListener('logout', logoutHandler);
    return () => window.removeEventListener('logout', logoutHandler);
  }, []);

  const onLoginChange = (user) => {
    if (user) {
      setIsLoggedIn(true);
      setAdminName(user.admin_name);
      localStorage.setItem('admins', JSON.stringify(user)); 
    } else {
      setIsLoggedIn(false);
      setAdminName(null);
      localStorage.removeItem('admins');
    }
  };

  const isLoginPage = location.pathname === '/login';

  return (
    <div className="app-layout" style={{ display: 'flex' }}>
      {!isLoginPage && isLoggedIn && <Sidebar admin_name={admin_name} />}

      <div className="main-content" style={{ flex: 1, padding: '20px' }}>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />

          <Route path="/login" element={<Login onLoginChange={onLoginChange} />} />

          <Route
            path="/dashboard"
            element={isLoggedIn ? <Dashboard /> : <Navigate to="/login" />}
          />
          <Route
            path="/employee"
            element={isLoggedIn ? <Employee /> : <Navigate to="/login" />}
          />
          <Route
            path="/user"
            element={isLoggedIn ? <User /> : <Navigate to="/login" />}
          />
          <Route
            path="/report"
            element={isLoggedIn ? <Report /> : <Navigate to="/login" />}
          />
          <Route
            path="/summary"
            element={isLoggedIn ? <Summary /> : <Navigate to="/login" />}
          />
           <Route
            path="/employeeortal"
            element={isLoggedIn ? <EmployeePortal /> : <Navigate to="/login" />}
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
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



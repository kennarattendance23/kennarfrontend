import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import logo from '../logo.png';   
import '../sidebar.css';

const Sidebar = ({ admin_name }) => {
  const location = useLocation();
  const currentPath = location.pathname.replace(/\/$/, '');

  return (
    <div className="sidebar">
      <div className="logo-container">
        <img
          src={logo}
          alt="Kennar Auto Shop Logo"
          className="sidebar-logo"
        />
      </div>

      <h3 className="admin-name">{admin_name || 'Guest'}</h3>

      <nav>
        <Link to="/dashboard" className={currentPath === '/dashboard' ? 'active' : ''}>
          <img src="/icons/homereal.png" alt="Dashboard" className="sidebar-icon" />
          <span>Dashboard</span>
        </Link>
        <Link to="/employee" className={currentPath === '/employee' ? 'active' : ''}>
          <img src="/icons/employee-man-alt.png" alt="Employee" className="sidebar-icon" />
          <span>Employee</span>
        </Link>
        <Link to="/user" className={currentPath === '/user' ? 'active' : ''}>
          <img src="/icons/circle-user.png" alt="User" className="sidebar-icon" />
          <span>User</span>
        </Link>
        <Link to="/report" className={currentPath === '/report' ? 'active' : ''}>
          <img src="/icons/newspaper.png" alt="Record" className="sidebar-icon" />
          <span>Record</span>
        </Link>
        <Link to="/summary" className={currentPath === '/summary' ? 'active' : ''}>
          <img src="/icons/approved.png" alt="Summary" className="sidebar-icon" />
          <span>Summary</span>
        </Link>
      </nav>
    </div>
  );
};

export default Sidebar;
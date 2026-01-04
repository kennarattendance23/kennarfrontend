import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../EmployeePortal.css";

const API_BASE = "https://kennarbackend.onrender.com/api";

function EmployeePortal() {
  const navigate = useNavigate();

  // ✅ CORRECT STORAGE KEY
  const user = JSON.parse(localStorage.getItem("admins"));

  const [employee, setEmployee] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔐 AUTH + ROLE GUARD
  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    if (user.role !== "employee") {
      navigate("/dashboard", { replace: true });
      return;
    }
  }, [user, navigate]);

  // ⏰ CLOCK (MANILA TIME)
  useEffect(() => {
    const interval = setInterval(() => {
      const manilaTime = new Date().toLocaleString("en-US", {
        timeZone: "Asia/Manila",
      });
      setCurrentTime(new Date(manilaTime));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // 👤 FETCH EMPLOYEE BY EMAIL
  useEffect(() => {
    if (!user?.username) return;

    axios.get(`${API_BASE}/employees`)
      .then(res => {
        const emp = res.data.find(
          e => e.email === user.username
        );

        setEmployee(emp || null);
        setLoading(false);
      })
      .catch(err => {
        console.error("❌ Employee fetch failed:", err);
        setLoading(false);
      });
  }, [user]);

  // 📋 FETCH ATTENDANCE
  useEffect(() => {
    if (!employee?.employee_id) return;

    axios.get(`${API_BASE}/attendance`)
      .then(res => {
        const logs = res.data.filter(
          e => e.employee_id === employee.employee_id
        );
        setAttendanceLogs(logs);
      })
      .catch(err => {
        console.error("❌ Attendance fetch failed:", err);
        setAttendanceLogs([]);
      });
  }, [employee, statusMessage]);

  // 🕒 TIME IN
  const handleTimeIn = async () => {
    try {
      await axios.post(`${API_BASE}/attendance/time_in`, {
        employee_id: employee.employee_id,
        fullname: employee.name,
      });
      setStatusMessage("🟢 Time-in recorded.");
    } catch (err) {
      console.error(err);
      setStatusMessage("❌ Failed to time-in.");
    }
  };

  // 🏁 TIME OUT
  const handleTimeOut = async () => {
    try {
      await axios.post(`${API_BASE}/attendance/time_out`, {
        employee_id: employee.employee_id,
      });
      setStatusMessage("🔴 Time-out recorded.");
    } catch (err) {
      console.error(err);
      setStatusMessage("❌ Failed to time-out.");
    }
  };

  // ⏳ LOADING STATE
  if (loading) {
    return <div style={{ padding: 40 }}>Loading employee portal...</div>;
  }

  if (!employee) {
    return <div style={{ padding: 40 }}>Employee record not found.</div>;
  }

  return (
    <div className="dashboard-main">
      <div className="header">
        <h1>EMPLOYEE PORTAL</h1>
        <button
          className="logout-btn"
          onClick={() => {
            localStorage.removeItem("admins");
            window.location.href = "/login";
          }}
        >
          Logout
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-box"><strong>ID</strong><p>{employee.employee_id}</p></div>
        <div className="stat-box"><strong>Name</strong><p>{employee.name}</p></div>
        <div className="stat-box"><strong>Status</strong><p>{employee.status}</p></div>
      </div>

      <div className="calendar_clock">
        <div className="calendars">
          <h3>Current Day</h3>
          <p>{currentTime.toDateString()}</p>
        </div>

        <div className="clocks">
          <h3>Current Time</h3>
          <p>{currentTime.toLocaleTimeString()}</p>
        </div>
      </div>

      <div style={{ marginTop: 40, textAlign: "center" }}>
        <button onClick={handleTimeIn} className="in-button">🕒 Time In</button>
        <button onClick={handleTimeOut} className="out-button">🏁 Time Out</button>
        <p>{statusMessage}</p>
      </div>

      <div className="report_table" style={{ marginTop: 40 }}>
        <h3>Your Attendance Logs</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Time In</th>
              <th>In Status</th>
              <th>Time Out</th>
              <th>Out Status</th>
            </tr>
          </thead>
          <tbody>
            {attendanceLogs.map((log, i) => (
              <tr key={i}>
                <td>{log.date ? new Date(log.date).toLocaleDateString() : "-"}</td>
                <td>{log.time_in || "-"}</td>
                <td>{log.in_status || "-"}</td>
                <td>{log.time_out || "-"}</td>
                <td>{log.out_status || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default EmployeePortal;

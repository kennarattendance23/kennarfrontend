import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../EmployeePortal.css";

const API_BASE = "https://kennarbackend.onrender.com/api";

function EmployeePortal() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("admins"));

  const [employee, setEmployee] = useState(user || null);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());

  /* ================= AUTH + ROLE GUARD ================= */
  useEffect(() => {
    if (!user) navigate("/login", { replace: true });
    if (user?.role !== "employee") navigate("/dashboard", { replace: true });
    if (!user?.employee_id) navigate("/login", { replace: true });
  }, [user, navigate]);

  /* ================= CLOCK ================= */
  useEffect(() => {
    const interval = setInterval(() => {
      const manilaTime = new Date().toLocaleString("en-US", {
        timeZone: "Asia/Manila",
      });
      setCurrentTime(new Date(manilaTime));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  /* ================= FETCH EMPLOYEE ================= */
  useEffect(() => {
    if (!user?.employee_id) return;

    axios.get(`${API_BASE}/employees`)
      .then(res => {
        const emp = res.data.find(
          e => Number(e.employee_id) === Number(user.employee_id)
        );
        setEmployee(emp || user);
      })
      .catch(err => console.error("❌ Employee fetch error:", err));
  }, [user]);

  /* ================= FETCH ATTENDANCE ================= */
  const fetchAttendanceLogs = async () => {
    if (!employee?.employee_id) return;
    try {
      const res = await axios.get(`${API_BASE}/attendance`);
      const logs = res.data.filter(
        a => Number(a.employee_id) === Number(employee.employee_id)
      );
      setAttendanceLogs(logs);

      // Find today's record
      const today = new Date().toISOString().split("T")[0];
      const todayRecord = logs.find(log => log.date?.startsWith(today));
      setTodayAttendance(todayRecord || null);
    } catch (err) {
      console.error("❌ Attendance fetch error:", err.response || err);
    }
  };

  useEffect(() => {
    fetchAttendanceLogs();
  }, [employee]);

  /* ================= TIME IN ================= */
  const handleTimeIn = async () => {
    if (!todayAttendance) {
      setStatusMessage("❌ No attendance record found for today.");
      return;
    }

    try {
      const res = await axios.put(
        `${API_BASE}/attendance/${todayAttendance.attendance_id}/time-in`,
        { time_in: currentTime.toLocaleTimeString("en-GB") } // format HH:MM:SS
      );
      console.log("Time-in response:", res.data);
      setStatusMessage("🟢 Time-in recorded.");
      fetchAttendanceLogs();
    } catch (err) {
      console.error("Time-in error:", err.response || err);
      setStatusMessage("❌ Failed to time-in.");
    }
  };

  /* ================= TIME OUT ================= */
  const handleTimeOut = async () => {
    if (!todayAttendance) {
      setStatusMessage("❌ No attendance record found for today.");
      return;
    }

    try {
      // Calculate working hours if needed
      let timeInSeconds = 0;
      if (todayAttendance.time_in) {
        const parts = todayAttendance.time_in.split(":").map(Number);
        timeInSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
      }

      const nowParts = currentTime.toLocaleTimeString("en-GB").split(":").map(Number);
      const nowSeconds = nowParts[0] * 3600 + nowParts[1] * 60 + nowParts[2];
      let workingHours = Math.max(0, (nowSeconds - timeInSeconds) / 3600);
      workingHours = Math.round(workingHours * 100) / 100; // round to 2 decimals

      const res = await axios.put(
        `${API_BASE}/attendance/${todayAttendance.attendance_id}`,
        {
          time_out: currentTime.toLocaleTimeString("en-GB"),
          working_hours: workingHours,
        }
      );
      console.log("Time-out response:", res.data);
      setStatusMessage("🔴 Time-out recorded.");
      fetchAttendanceLogs();
    } catch (err) {
      console.error("Time-out error:", err.response || err);
      setStatusMessage("❌ Failed to time-out.");
    }
  };

  /* ================= UI ================= */
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
        <div className="stat-box">
          <strong>Employee ID</strong>
          <p>{employee?.employee_id || "-"}</p>
        </div>
        <div className="stat-box">
          <strong>Name</strong>
          <p>{employee?.name || "-"}</p>
        </div>
        <div className="stat-box">
          <strong>Status</strong>
          <p>{employee?.status || "-"}</p>
        </div>
      </div>

      <div className="calendar_clock">
        <div>
          <h3>Current Day</h3>
          <p>{currentTime.toDateString()}</p>
        </div>
        <div>
          <h3>Current Time</h3>
          <p>{currentTime.toLocaleTimeString()}</p>
        </div>
      </div>

      <div style={{ marginTop: 30, textAlign: "center" }}>
        <button onClick={handleTimeIn} className="in-button">🕒 Time In</button>
        <button onClick={handleTimeOut} className="out-button">🏁 Time Out</button>
        <p>{statusMessage}</p>
      </div>

      <div className="report_table" style={{ marginTop: 40 }}>
        <h3>Your Attendance Logs</h3>
        <div className="table-wrapper">
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
                  <td>{log.status || "-"}</td>
                  <td>{log.time_out || "-"}</td>
                  <td>{log.working_hours || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default EmployeePortal;

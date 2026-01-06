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
      .catch(err => console.error("❌ Employee fetch error:", err.response || err));
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
      let todayRecord = logs.find(log => log.date?.startsWith(today));

      // If no record, create one automatically with pending status
      if (!todayRecord) {
        const createRes = await axios.post(`${API_BASE}/attendance`, {
          employee_id: employee.employee_id,
          fullname: employee.name,
          date: today,
          status: "pending", // default pending
        });
        todayRecord = createRes.data;
      }

      setTodayAttendance(todayRecord);
    } catch (err) {
      console.error("❌ Attendance fetch/create error:", err.response || err);
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
      const timeString = currentTime.toLocaleTimeString("en-GB"); // HH:MM:SS

      // Submit time-in with pending status
      const res = await axios.put(
        `${API_BASE}/attendance/${todayAttendance.attendance_id}/time-in`,
        { time_in: timeString, status: "pending" }
      );

      setStatusMessage("🟡 Time-in submitted for approval.");
      fetchAttendanceLogs();
    } catch (err) {
      console.error("Time-in error:", err.response || err);
      setStatusMessage("❌ Failed to submit time-in.");
    }
  };

  /* ================= TIME OUT ================= */
  const handleTimeOut = async () => {
    if (!todayAttendance) {
      setStatusMessage("❌ No attendance record found for today.");
      return;
    }

    try {
      const timeOutString = currentTime.toLocaleTimeString("en-GB");

      // Calculate working hours if time_in exists
      let workingHours = 0;
      if (todayAttendance.time_in) {
        const [h, m, s] = todayAttendance.time_in.split(":").map(Number);
        const timeInSec = h * 3600 + m * 60 + s;

        const [oh, om, os] = timeOutString.split(":").map(Number);
        const timeOutSec = oh * 3600 + om * 60 + os;

        workingHours = Math.max(0, (timeOutSec - timeInSec) / 3600);
        workingHours = Math.round(workingHours * 100) / 100; // 2 decimals
      }

      // Submit time-out with pending status
      const res = await axios.put(
        `${API_BASE}/attendance/${todayAttendance.attendance_id}/time-out`,
        { time_out: timeOutString, working_hours: workingHours, status: "pending" }
      );

      setStatusMessage("🟡 Time-out submitted for approval.");
      fetchAttendanceLogs();
    } catch (err) {
      console.error("Time-out error:", err.response || err);
      setStatusMessage("❌ Failed to submit time-out.");
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
                <th>Status</th>
                <th>Time Out</th>
                <th>Working Hours</th>
              </tr>
            </thead>
            <tbody>
              {attendanceLogs.map((log, i) => (
                <tr key={i}>
                  <td>{log.date ? new Date(log.date).toLocaleDateString() : "-"}</td>
                  <td>{log.time_in || "-"}</td>
                  <td>
                    {log.status === "approved" && "🟢 Approved"}
                    {log.status === "pending" && "🟡 Pending"}
                    {log.status === "rejected" && "🔴 Rejected"}
                  </td>
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

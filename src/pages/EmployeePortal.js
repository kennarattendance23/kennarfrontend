import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../EmployeePortal.css";

const API_BASE = "https://kennarbackend.onrender.com/api";

/* ================= MANILA DATE HELPER ================= */
const getManilaDate = () => {
  const manila = new Date().toLocaleString("en-CA", {
    timeZone: "Asia/Manila",
  });
  return manila.split(",")[0];
};

function EmployeePortal() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("admins"));

  const [employee, setEmployee] = useState(null);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);

  /* ================= AUTH GUARD ================= */
  useEffect(() => {
    if (!user) return navigate("/login", { replace: true });
    if (user.role !== "employee")
      return navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  /* ================= CLOCK ================= */
  useEffect(() => {
    const interval = setInterval(() => {
      const manilaNow = new Date().toLocaleString("en-US", {
        timeZone: "Asia/Manila",
      });
      setCurrentTime(new Date(manilaNow));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  /* ================= FETCH EMPLOYEE ================= */
  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const res = await axios.get(`${API_BASE}/employees`);
        const emp = res.data.find(
          (e) => Number(e.employee_id) === Number(user.employee_id)
        );
        setEmployee(emp);
      } catch {
        navigate("/login", { replace: true });
      }
    };

    fetchEmployee();
  }, [user, navigate]);

  /* ================= FETCH ATTENDANCE ================= */
  useEffect(() => {
    if (!employee) return;

    const fetchAttendance = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/attendance`);
        const logs = res.data.filter(
          (a) => Number(a.employee_id) === Number(employee.employee_id)
        );

        setAttendanceLogs(logs);

        const today = getManilaDate();
        const todayLog = logs.find((l) => l.date === today);
        setTodayAttendance(todayLog);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [employee]);

  /* ================= TIME IN ================= */
  const handleTimeIn = async () => {
    if (loading || todayAttendance?.time_in) return;

    try {
      await axios.put(
        `${API_BASE}/attendance/${todayAttendance.id}/time-in`,
        {
          time_in: currentTime.toLocaleTimeString("en-GB"),
        }
      );
      window.location.reload();
    } catch {
      setStatusMessage("Failed to time in");
    }
  };

  /* ================= TIME OUT ================= */
  const handleTimeOut = async () => {
    if (loading || !todayAttendance?.time_in || todayAttendance?.time_out)
      return;

    try {
      await axios.put(`${API_BASE}/attendance/${todayAttendance.id}`, {
        time_out: currentTime.toLocaleTimeString("en-GB"),
      });
      window.location.reload();
    } catch {
      setStatusMessage("Failed to time out");
    }
  };

  return (
    <div className="employee-scroll">
      <div className="employee-portal">
        {/* HEADER */}
        <div className="header">
          <h1>EMPLOYEE PORTAL</h1>
          <button
            className="logout-btn"
            onClick={() => {
              localStorage.removeItem("admins");
              navigate("/login");
            }}
          >
            Logout
          </button>
        </div>

        {/* INFO BOXES */}
        <div className="stats-grid">
          <div className="stat-box">
            <strong>Employee ID</strong>
            <p>{employee?.employee_id}</p>
          </div>
          <div className="stat-box">
            <strong>Name</strong>
            <p>{employee?.name}</p>
          </div>
          <div className="stat-box">
            <strong>Status</strong>
            <p>{employee?.status}</p>
          </div>
        </div>

        {/* CLOCK */}
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

        {/* BUTTONS */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <button className="in-button" onClick={handleTimeIn}>
            🕒 Time In
          </button>
          <button className="out-button" onClick={handleTimeOut}>
            🏁 Time Out
          </button>
          <p>{statusMessage}</p>
        </div>

        {/* TABLE */}
        <div className="report_table">
          <h3>Your Attendance Logs</h3>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Time In</th>
                <th>Status</th>
                <th>Time Out</th>
              </tr>
            </thead>
            <tbody>
              {attendanceLogs.map((log) => (
                <tr key={log.id}>
                  <td>{log.date}</td>
                  <td>{log.time_in || "-"}</td>
                  <td>{log.status || "-"}</td>
                  <td>{log.time_out || "-"}</td>
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

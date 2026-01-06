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
  return manila.split(",")[0]; // YYYY-MM-DD
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
    if (!user.employee_id) return navigate("/login", { replace: true });
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
    if (!user?.employee_id) return;

    const fetchEmployee = async () => {
      try {
        const res = await axios.get(`${API_BASE}/employees`);
        const emp = res.data.find(
          (e) => Number(e.employee_id) === Number(user.employee_id)
        );
        setEmployee(emp || user);
      } catch (err) {
        console.error("❌ Employee fetch error:", err);
        navigate("/login", { replace: true });
      }
    };

    fetchEmployee();
  }, [user, navigate]);

  /* ================= FETCH / CREATE ATTENDANCE ================= */
  useEffect(() => {
    if (!employee?.employee_id) return;

    const fetchAttendanceLogs = async () => {
      setLoading(true);

      try {
        const res = await axios.get(`${API_BASE}/attendance`);
        const logs = res.data
          .filter((a) => Number(a.employee_id) === Number(employee.employee_id))
          .map((a) => ({
            id: a.id,
            employee_id: a.employee_id,
            fullname: a.fullname,
            date: a.date, // already DATE
            status: a.status || "Present",
            time_in: a.time_in || null,
            time_out: a.time_out || null,
            working_hours: a.working_hours || 0,
          }));

        setAttendanceLogs(logs);

        const today = getManilaDate();

        let todayRecord = logs.find((log) => log.date === today);

        if (!todayRecord) {
          // Create new attendance
          const createRes = await axios.post(`${API_BASE}/attendance`, {
            employee_id: employee.employee_id,
            fullname: employee.name,
            date: today,
            status: "Present",
          });

          todayRecord = {
            id: createRes.data.id,
            employee_id: employee.employee_id,
            fullname: employee.name,
            date: today,
            status: "Present",
            time_in: null,
            time_out: null,
            working_hours: 0,
          };
        }

        setTodayAttendance(todayRecord);
      } catch (err) {
        console.error("❌ Attendance fetch/create error:", err.response || err);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendanceLogs();
  }, [employee]);

  /* ================= TIME IN ================= */
  const handleTimeIn = async () => {
    if (loading) {
      setStatusMessage("⏳ Initializing attendance, please wait...");
      return;
    }

    if (!todayAttendance?.id) {
      setStatusMessage("❌ Attendance record not ready yet.");
      return;
    }

    if (todayAttendance.time_in) {
      setStatusMessage("⚠️ Already timed in.");
      return;
    }

    try {
      const time = currentTime.toLocaleTimeString("en-GB");

      await axios.put(`${API_BASE}/attendance/${todayAttendance.id}/time-in`, {
        time_in: time,
      });

      setStatusMessage("🟢 Time-in recorded successfully.");
      window.location.reload();
    } catch (err) {
      console.error("❌ Time-in error:", err.response || err);
      setStatusMessage("❌ Failed to time-in.");
    }
  };

  /* ================= TIME OUT ================= */
  const handleTimeOut = async () => {
    if (loading) {
      setStatusMessage("⏳ Initializing attendance, please wait...");
      return;
    }

    if (!todayAttendance?.id) {
      setStatusMessage("❌ Attendance record not ready yet.");
      return;
    }

    if (!todayAttendance.time_in) {
      setStatusMessage("⚠️ You must time in first.");
      return;
    }

    if (todayAttendance.time_out) {
      setStatusMessage("⚠️ Already timed out.");
      return;
    }

    try {
      const timeOut = currentTime.toLocaleTimeString("en-GB");

      const [h, m, s] = todayAttendance.time_in.split(":").map(Number);
      const [oh, om, os] = timeOut.split(":").map(Number);

      const hours =
        Math.round(
          ((oh * 3600 + om * 60 + os - (h * 3600 + m * 60 + s)) / 3600) * 100
        ) / 100;

      await axios.put(`${API_BASE}/attendance/${todayAttendance.id}`, {
        time_out: timeOut,
        working_hours: Math.max(0, hours),
      });

      setStatusMessage("🔴 Time-out recorded successfully.");
      window.location.reload();
    } catch (err) {
      console.error("❌ Time-out error:", err.response || err);
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
          <strong>ID</strong>
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
        <button onClick={handleTimeIn} className="in-button">
          🕒 Time In
        </button>
        <button onClick={handleTimeOut} className="out-button">
          🏁 Time Out
        </button>
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
                  <td>{log.date || "-"}</td>
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

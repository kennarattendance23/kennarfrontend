import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../EmployeePortal.css";

const API_BASE = "https://kennarbackend.onrender.com/api";

/* ================= MANILA DATE (YYYY-MM-DD) ================= */
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
    if (!user.employee_id) return navigate("/login", { replace: true });
  }, [user, navigate]);

  /* ================= CLOCK (MANILA TIME) ================= */
  useEffect(() => {
    const timer = setInterval(() => {
      const manilaNow = new Date().toLocaleString("en-US", {
        timeZone: "Asia/Manila",
      });
      setCurrentTime(new Date(manilaNow));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  /* ================= FETCH EMPLOYEE ================= */
  useEffect(() => {
    axios
      .get(`${API_BASE}/employees`)
      .then((res) => {
        const emp = res.data.find(
          (e) => Number(e.employee_id) === Number(user.employee_id)
        );
        setEmployee(emp);
      })
      .catch(() => navigate("/login"));
  }, [user, navigate]);

  /* ================= FETCH / CREATE ATTENDANCE ================= */
  useEffect(() => {
    if (!employee?.employee_id) return;

    const initAttendance = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/attendance`);

        const logs = res.data.filter(
          (a) => Number(a.employee_id) === Number(employee.employee_id)
        );

        setAttendanceLogs(logs);

        const today = getManilaDate();

        let todayRecord = logs.find((log) => {
          if (!log.date) return false;
          return log.date.split("T")[0] === today;
        });

        // ✅ CREATE TODAY RECORD IF MISSING
        if (!todayRecord) {
          const createRes = await axios.post(`${API_BASE}/attendance`, {
            employee_id: employee.employee_id,
            fullname: employee.name,
            date: today,
            status: "pending",
          });
          todayRecord = createRes.data;
        }

        setTodayAttendance(todayRecord);
      } catch (err) {
        console.error("Attendance init error:", err);
      } finally {
        setLoading(false);
      }
    };

    initAttendance();
  }, [employee]);

  /* ================= TIME IN ================= */
  const handleTimeIn = async () => {
    if (loading || !todayAttendance) {
      setStatusMessage("⏳ Initializing attendance...");
      return;
    }

    if (todayAttendance.time_in) {
      setStatusMessage("⚠️ Already timed in.");
      return;
    }

    try {
      const time = currentTime.toLocaleTimeString("en-GB");

      await axios.put(
        `${API_BASE}/attendance/${todayAttendance.attendance_id}/time-in`,
        { time_in: time }
      );

      setStatusMessage("🟢 Time-in submitted.");
      window.location.reload();
    } catch {
      setStatusMessage("❌ Time-in failed.");
    }
  };

  /* ================= TIME OUT ================= */
  const handleTimeOut = async () => {
    if (loading || !todayAttendance) {
      setStatusMessage("⏳ Initializing attendance...");
      return;
    }

    if (!todayAttendance.time_in) {
      setStatusMessage("⚠️ Time in first.");
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

      await axios.put(
        `${API_BASE}/attendance/${todayAttendance.attendance_id}`,
        {
          time_out: timeOut,
          working_hours: Math.max(0, hours),
        }
      );

      setStatusMessage("🔴 Time-out submitted.");
      window.location.reload();
    } catch {
      setStatusMessage("❌ Time-out failed.");
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

      <div className="calendar_clock">
        <p>{currentTime.toDateString()}</p>
        <p>{currentTime.toLocaleTimeString()}</p>
      </div>

      <div className="actions">
        <button onClick={handleTimeIn} className="in-button">
          🕒 Time In
        </button>
        <button onClick={handleTimeOut} className="out-button">
          🏁 Time Out
        </button>
        <p>{statusMessage}</p>
      </div>

      <div className="report_table">
        <h3>Your Attendance Logs</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Time In</th>
              <th>Status</th>
              <th>Time Out</th>
              <th>Hours</th>
            </tr>
          </thead>
          <tbody>
            {attendanceLogs.map((log, i) => (
              <tr key={i}>
                <td>{log.date?.split("T")[0]}</td>
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
  );
}

export default EmployeePortal;

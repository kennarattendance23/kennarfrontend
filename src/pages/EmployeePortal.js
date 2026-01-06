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
    if (!user) navigate("/login", { replace: true });
    else if (user.role !== "employee")
      navigate("/dashboard", { replace: true });
    else if (!user.employee_id)
      navigate("/login", { replace: true });
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

    axios
      .get(`${API_BASE}/employees`)
      .then((res) => {
        const emp = res.data.find(
          (e) => Number(e.employee_id) === Number(user.employee_id)
        );
        setEmployee(emp || user);
      })
      .catch(() => navigate("/login", { replace: true }));
  }, [user, navigate]);

  /* ================= FETCH ATTENDANCE ================= */
  useEffect(() => {
    if (!employee?.employee_id) return;

    const fetchAttendance = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/attendance`);
        const logs = res.data.filter(
          (a) => Number(a.employee_id) === Number(employee.employee_id)
        );

        setAttendanceLogs(logs);

        const today = getManilaDate();
        let todayLog = logs.find((l) => l.date === today);

        if (!todayLog) {
          const create = await axios.post(`${API_BASE}/attendance`, {
            employee_id: employee.employee_id,
            fullname: employee.name,
            date: today,
            status: "Present",
          });
          todayLog = create.data;
        }

        setTodayAttendance(todayLog);
      } catch (err) {
        console.error(err);
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
      setStatusMessage("Failed to time in.");
    }
  };

  /* ================= TIME OUT ================= */
  const handleTimeOut = async () => {
    if (loading || !todayAttendance?.time_in || todayAttendance?.time_out)
      return;

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

      window.location.reload();
    } catch {
      setStatusMessage("Failed to time out.");
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
          <p>{employee?.status || "Active"}</p>
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

      <div className="button-row">
        <button className="in-button" onClick={handleTimeIn}>
           Time In
        </button>
        <button className="out-button" onClick={handleTimeOut}>
           Time Out
        </button>
      </div>

      <p style={{ textAlign: "center", fontWeight: "bold" }}>
        {statusMessage}
      </p>

      <div className="report_table">
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
                  <td>{log.date}</td>
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

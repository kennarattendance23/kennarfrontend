import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../EmployeePortal.css";

const API_BASE = "https://kennarbackend.onrender.com/api";

/* ================= MANILA HELPERS ================= */
const getManilaDate = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });

const getManilaTime = () =>
  new Date().toLocaleTimeString("en-GB", { timeZone: "Asia/Manila" });

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
    else if (user.role !== "employee") navigate("/dashboard", { replace: true });
    else if (!user.employee_id) navigate("/login", { replace: true });
  }, [user, navigate]);

  /* ================= CLOCK ================= */
  useEffect(() => {
    const interval = setInterval(() => {
      const manilaNow = new Date(
        new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" })
      );
      setCurrentTime(manilaNow);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  /* ================= FETCH EMPLOYEE ================= */
  useEffect(() => {
    if (!user?.employee_id) return;

    axios
      .get(`${API_BASE}/employees`)
      .then((res) => {
        const empArray = Array.isArray(res.data) ? res.data : res.data.data || [];
        const emp = empArray.find(
          (e) => Number(e.employee_id) === Number(user.employee_id)
        );
        setEmployee(emp || user);
      })
      .catch((err) => {
        console.error("Error fetching employee:", err.response || err);
        navigate("/login", { replace: true });
      });
  }, [user, navigate]);

  /* ================= FETCH ATTENDANCE ================= */
  useEffect(() => {
    if (!employee?.employee_id) return;

    const fetchAttendance = async () => {
      setLoading(true);
      setStatusMessage("");

      try {
        const res = await axios.get(`${API_BASE}/attendance`);
        const allLogs = Array.isArray(res.data) ? res.data : res.data.data || [];
        const logs = allLogs.filter(
          (a) => Number(a.employee_id) === Number(employee.employee_id)
        );
        setAttendanceLogs(logs);

        const today = getManilaDate();
        let todayLog = logs.find(
          (l) =>
            new Date(l.date).toDateString() === new Date(today).toDateString()
        );

        // Create attendance if missing
        if (!todayLog) {
          try {
            const createRes = await axios.post(`${API_BASE}/attendance`, {
              employee_id: employee.employee_id,
              fullname: employee.name || employee.fullname || user.name || "Employee",
              date: today,
              status: "Present",
            });
            todayLog = createRes.data;
          } catch (err) {
            console.error("Could not create today's attendance:", err.response || err);
            // Use placeholder to allow Time In
            todayLog = {
              employee_id: employee.employee_id,
              fullname: employee.name || employee.fullname || user.name || "Employee",
              date: today,
              status: "Unknown",
              time_in: null,
              time_out: null,
              working_hours: null,
            };
            setStatusMessage("Using placeholder attendance. Time In will create record.");
          }
        }

        setTodayAttendance(todayLog);
      } catch (err) {
        console.error("Attendance fetch error:", err.response || err);
        setTodayAttendance({
          employee_id: employee.employee_id,
          fullname: employee.name || employee.fullname || user.name || "Employee",
          date: getManilaDate(),
          status: "Unknown",
          time_in: null,
          time_out: null,
          working_hours: null,
        });
        setStatusMessage("Failed to load attendance. Using placeholder.");
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [employee, user]);

  /* ================= TIME IN ================= */
  const handleTimeIn = async () => {
    if (loading || todayAttendance?.time_in) return;

    setLoading(true);
    try {
      let attendanceId = todayAttendance.id;

      // If no record yet, create attendance with time_in
      if (!attendanceId) {
        const res = await axios.post(`${API_BASE}/attendance`, {
          employee_id: employee.employee_id,
          fullname: employee.name || employee.fullname || user.name || "Employee",
          date: getManilaDate(),
          status: "Present",
          time_in: getManilaTime(),
        });
        attendanceId = res.data.id;
        setTodayAttendance(res.data);
      } else {
        const timeIn = getManilaTime();
        await axios.put(`${API_BASE}/attendance/${attendanceId}/time-in`, {
          time_in: timeIn,
        });
        setTodayAttendance((prev) => ({ ...prev, time_in: timeIn }));
      }

      setStatusMessage("Time In recorded successfully.");
    } catch (err) {
      console.error("Time In error:", err.response || err);
      setStatusMessage("Failed to time in.");
    } finally {
      setLoading(false);
    }
  };

  /* ================= TIME OUT ================= */
  const handleTimeOut = async () => {
    if (loading || !todayAttendance?.time_in || todayAttendance?.time_out) return;

    setLoading(true);
    try {
      let attendanceId = todayAttendance.id;
      const timeOut = getManilaTime();

      const [h, m, s] = todayAttendance.time_in.split(":").map(Number);
      const [oh, om, os] = timeOut.split(":").map(Number);
      const hours =
        Math.round(((oh * 3600 + om * 60 + os - (h * 3600 + m * 60 + s)) / 3600) * 100) / 100;

      if (attendanceId) {
        await axios.put(`${API_BASE}/attendance/${attendanceId}`, {
          time_out: timeOut,
          working_hours: Math.max(0, hours),
        });
        setTodayAttendance((prev) => ({
          ...prev,
          time_out: timeOut,
          working_hours: Math.max(0, hours),
        }));
      } else {
        // Create record if somehow missing
        const res = await axios.post(`${API_BASE}/attendance`, {
          employee_id: employee.employee_id,
          fullname: employee.name || employee.fullname || user.name || "Employee",
          date: getManilaDate(),
          status: "Present",
          time_in: todayAttendance.time_in || getManilaTime(),
          time_out: timeOut,
          working_hours: Math.max(0, hours),
        });
        setTodayAttendance(res.data);
      }

      setStatusMessage("Time Out recorded successfully.");
    } catch (err) {
      console.error("Time Out error:", err.response || err);
      setStatusMessage("Failed to time out.");
    } finally {
      setLoading(false);
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
          <p>{employee?.name || employee?.fullname || "-"}</p>
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
        <button
          className="in-button"
          onClick={handleTimeIn}
          disabled={loading || todayAttendance?.time_in}
        >
          Time In
        </button>

        <button
          className="out-button"
          onClick={handleTimeOut}
          disabled={loading || !todayAttendance?.time_in || todayAttendance?.time_out}
        >
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

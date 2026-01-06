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
        const emp = res.data.find(
          (e) => Number(e.employee_id) === Number(user.employee_id)
        );
        if (!emp) {
          console.warn("Employee not found in backend, using local user data");
        }
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
        // Step 1: Fetch all attendance logs
        const res = await axios.get(`${API_BASE}/attendance`);
        console.log("Fetched all attendance:", res.data);

        const logs = res.data.filter(
          (a) => Number(a.employee_id) === Number(employee.employee_id)
        );
        setAttendanceLogs(logs);

        const today = getManilaDate();
        console.log("Today's date:", today);

        // Step 2: Find today's attendance
        let todayLog = logs.find((l) => l.date === today);

        // Step 3: Create today's record if missing
        if (!todayLog) {
          console.log("No attendance for today, attempting to create...");
          try {
            const createRes = await axios.post(`${API_BASE}/attendance`, {
              employee_id: employee.employee_id,
              fullname: employee.name || employee.fullname || user.name || "Employee",
              date: today,
              status: "Present",
            });
            todayLog = createRes.data;
            console.log("Created today's attendance:", todayLog);
          } catch (createErr) {
            console.error("Error creating today's attendance:", createErr.response || createErr);
            // Retry fetching after failed creation (record may already exist)
            const retryRes = await axios.get(`${API_BASE}/attendance`);
            todayLog = retryRes.data.find(
              (l) =>
                Number(l.employee_id) === Number(employee.employee_id) &&
                l.date === today
            );
            if (todayLog) {
              console.log("Fetched today's attendance on retry:", todayLog);
            }
          }
        }

        if (!todayLog) {
          throw new Error("Attendance record for today could not be loaded.");
        }

        setTodayAttendance(todayLog);
      } catch (err) {
        console.error("Attendance error:", err.response || err);
        setStatusMessage("Failed to load attendance.");
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [employee, user]);

  /* ================= TIME IN ================= */
  const handleTimeIn = async () => {
    if (loading || !todayAttendance?.id || todayAttendance.time_in) return;

    try {
      const timeIn = getManilaTime();

      await axios.put(
        `${API_BASE}/attendance/${todayAttendance.id}/time-in`,
        { time_in: timeIn }
      );

      setTodayAttendance((prev) => ({
        ...prev,
        time_in: timeIn,
      }));

      setStatusMessage("Time In recorded successfully.");
    } catch (err) {
      console.error("Time In error:", err.response || err);
      setStatusMessage("Failed to time in.");
    }
  };

  /* ================= TIME OUT ================= */
  const handleTimeOut = async () => {
    if (
      loading ||
      !todayAttendance?.id ||
      !todayAttendance.time_in ||
      todayAttendance.time_out
    )
      return;

    try {
      const timeOut = getManilaTime();

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

      setTodayAttendance((prev) => ({
        ...prev,
        time_out: timeOut,
        working_hours: Math.max(0, hours),
      }));

      setStatusMessage("Time Out recorded successfully.");
    } catch (err) {
      console.error("Time Out error:", err.response || err);
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

      {!todayAttendance && !loading && (
        <p style={{ textAlign: "center", color: "red", fontWeight: "bold" }}>
          Attendance record for today could not be loaded.
        </p>
      )}

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
          disabled={
            loading || !todayAttendance?.time_in || todayAttendance?.time_out
          }
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

EMPLOYEEPORTAL.JS

import React, { useEffect, useState } from "react";
import axios from "axios";
import "../EmployeePortal.css";


function EmployeePortal() {
  const user = JSON.parse(localStorage.getItem("user"));
  const [employee, setEmployee] = useState(null);
  const [statusMessage, setStatusMessage] = useState(""); 
  const [currentTime, setCurrentTime] = useState(new Date());
  const [attendanceLogs, setAttendanceLogs] = useState([]);


  useEffect(() => {
    const interval = setInterval(() => {
      const manilaTime = new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" });
      setCurrentTime(new Date(manilaTime));
    }, 1000);
    return () => clearInterval(interval);
  }, []);


  useEffect(() => {
    axios.get("https://kennarbackend.onrender.com/api/employees")
      .then(res => {
        const emp = res.data.find(e => e.employee_id === user.empId);
        setEmployee(emp);
      });
  }, [user.empId]);


  useEffect(() => {
    if (user.empId) {
      axios.get("https://kennarbackend.onrender.com/api/attendance")
        .then(res => {
          const logs = res.data.filter(e => e.employee_id === user.empId);
          setAttendanceLogs(logs);
        });
    }
  }, [user.empId, statusMessage]);


  const handleTimeIn = async () => {
    const todayDateStr = new Date(currentTime).toISOString().split("T")[0];
    const todayLogs = attendanceLogs.filter(log =>
      log.date && new Date(log.date).toISOString().split("T")[0] === todayDateStr
    );
    const todayLog = todayLogs[todayLogs.length - 1];
    const hasTimedInToday = todayLog && todayLog.time_in;


    if (hasTimedInToday) {
      setStatusMessage("⛔ Already timed in today.");
      return;
    }


    try {
      await axios.post("https://kennarbackend.onrender.com/api/attendance/time_in", {
        employee_id: employee.employee_id,
        fullname: employee.name,
      });
      setStatusMessage("🟢 Time-in recorded.");
    } catch (error) {
      console.error("Time-in failed:", error);
      setStatusMessage("❌ Failed to time-in.");
    }
  };


  const handleTimeOut = async () => {
    const todayDateStr = new Date(currentTime).toISOString().split("T")[0];
    const todayLogs = attendanceLogs.filter(log =>
      log.date && new Date(log.date).toISOString().split("T")[0] === todayDateStr
    );
    const todayLog = todayLogs[todayLogs.length - 1];
    const hasTimedOutToday = todayLog && todayLog.time_out;


    if (!todayLog || !todayLog.time_in) {
      setStatusMessage("⚠️ Please time in first.");
      return;
    }
    if (hasTimedOutToday) {
      setStatusMessage("⛔ Already timed out today.");
      return;
    }


    try {
      await axios.post("https://kennarbackend.onrender.com/api/attendance/time_out", {
        employee_id: employee.employee_id,
      });
      setStatusMessage("🔴 Time-out recorded.");
    } catch (error) {
      console.error("Time-out failed:", error);
      setStatusMessage("❌ Failed to time-out.");
    }
  };


  if (!employee) return <div>Loading...</div>;


  return (
    <div className="dashboard-main">
      <div className="header">
        <h1>EMPLOYEE PORTAL</h1>
        <button
          className="logout-btn"
          onClick={() => {
            localStorage.removeItem("user");
            window.location.href = "/login";
          }}
        >
          Logout
        </button>
      </div>


      <div className="stats-grid">
        <div className="stat-box"><strong>Employee ID</strong><p>{employee.employee_id}</p></div>
        <div className="stat-box"><strong>Name</strong><p>{employee.name}</p></div>
        <div className="stat-box"><strong>Status</strong><p>{employee.status}</p></div>
      </div>


      <div className="calendar_clock">
        <div className="calendars">
          <h3>Current Day</h3>
          <p style={{ fontSize: "1.5em", fontWeight: "bold" }}>
            {currentTime.toDateString()}
          </p>
        </div>


        <div className="clocks" style={{ textAlign: "center" }}>
          <h3>Current Time</h3>
          <p style={{ fontSize: "1.5em", fontWeight: "bold" }}>
            {currentTime.toLocaleTimeString()}
          </p>
        </div>
      </div>


      <div style={{ marginTop: "40px", textAlign: "center" }}>
        <button onClick={handleTimeIn} className="in-button" style={{ marginRight: "10px" }}>🕒 Time In</button>
        <button onClick={handleTimeOut} className="out-button">🏁 Time Out</button>
        <p style={{ marginTop: "15px", fontWeight: "bold" }}>{statusMessage}</p>
      </div>


      <div className="report_table" style={{ marginTop: "40px" }}>
        <h3>Your Attendance Logs</h3>
        <table>
          <thead>
            <tr>
              <th>DATE</th>
              <th>TIME IN</th>
              <th>IN STATUS</th>
              <th>TIME OUT</th>
              <th>OUT STATUS</th>
            </tr>
          </thead>
          <tbody>
            {attendanceLogs.map((log, i) => {
              const formattedDate = log.date ? new Date(log.date).toLocaleDateString("en-CA") : "-";
              return (
                <tr key={i}>
                  <td>{formattedDate}</td>
                  <td>{log.time_in || "-"}</td>
                  <td>{log.in_status || "-"}</td>
                  <td>{log.time_out || "-"}</td>
                  <td>{log.out_status || "-"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}


export default EmployeePortal;

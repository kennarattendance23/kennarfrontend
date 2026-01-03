import React, { useEffect, useState } from "react";
import axios from "axios";
import "../Summary.css";

const Summary = () => {
  const [month, setMonth] = useState("");
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(false);

  const API_URL =
    "https://kennarbackend.onrender.com/api/attendance/summary";

  const getMonthOptions = () => {
    const months = [];
    const start = new Date(2024, 0); // adjust if needed
    const now = new Date();

    while (start <= now) {
      months.push({
        value: start.toISOString().slice(0, 7),
        label: start.toLocaleString("default", {
          month: "long",
          year: "numeric",
        }),
      });
      start.setMonth(start.getMonth() + 1);
    }
    return months.reverse();
  };

  useEffect(() => {
    if (month) fetchSummary();
  }, [month]);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}?month=${month}`);
      setSummary(res.data);
    } catch (err) {
      console.error("❌ Error loading summary:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Attendance Summary</title>
          <style>
            body { font-family: Arial; padding: 20px; }
            table { width: 100%; border-collapse: collapse; text-align: center; }
            th, td { border: 1px solid #000; padding: 8px; }
            th { background: #59a5f0; }
            td { background: #b3d9ff; }
          </style>
        </head>
        <body>
          <h2 style="text-align:center;">Attendance Summary (${month})</h2>
          <table>
            <thead>
              <tr>
                <th>EMPLOYEE ID</th>
                <th>FULL NAME</th>
                <th>DAYS PRESENT</th>
                <th>LATE COUNT</th>
                <th>ABSENCES</th>
                <th>TOTAL HOURS</th>
              </tr>
            </thead>
            <tbody>
              ${summary
                .map(
                  (r) => `
                  <tr>
                    <td>${r.employee_id}</td>
                    <td>${r.fullname}</td>
                    <td>${r.days_present}</td>
                    <td>${r.late_count}</td>
                    <td>${r.absences}</td>
                    <td>${r.total_hours}</td>
                  </tr>
                `
                )
                .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="summary-scroll-wrapper">
      <div className="summary-container">
        <h3 className="summary-header">Monthly Attendance Summary</h3>

        <div className="summary-controls">
          <label>Select Month:</label>
          <select value={month} onChange={(e) => setMonth(e.target.value)}>
            <option value="">-- Choose Month --</option>
            {getMonthOptions().map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>

          {month && (
            <button className="print-button" onClick={handlePrint}>
              Print
            </button>
          )}
        </div>

        <table className="summary-table">
          <thead>
            <tr>
              <th>EMPLOYEE ID</th>
              <th>FULL NAME</th>
              <th>DAYS PRESENT</th>
              <th>LATE COUNT</th>
              <th>ABSENCES</th>
              <th>TOTAL HOURS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6">Loading...</td>
              </tr>
            ) : summary.length ? (
              summary.map((row, idx) => (
                <tr key={idx}>
                  <td>{row.employee_id}</td>
                  <td>{row.fullname}</td>
                  <td>{row.days_present}</td>
                  <td>{row.late_count}</td>
                  <td>{row.absences}</td>
                  <td>{row.total_hours}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6">No data available</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Summary;


                  
"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "faculty-attendance-records";

export default function AttendanceHistory() {
  const [records, setRecords] = useState([]);

  useEffect(() => {
    function loadRecords() {
      try {
        const saved = JSON.parse(
          localStorage.getItem(STORAGE_KEY) || "[]"
        );
        setRecords(saved);
      } catch {
        setRecords([]);
      }
    }

    loadRecords();

    window.addEventListener("storage", loadRecords);
    window.addEventListener("focus", loadRecords);

    return () => {
      window.removeEventListener("storage", loadRecords);
      window.removeEventListener("focus", loadRecords);
    };
  }, []);

  return (
    <main className="dashboard-page">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="logo-icon">QR</div>
          <span>FACULTY<br />ATTENDANCE</span>
        </div>

        <nav className="sidebar-nav">
          <a className="nav-link" href="/dashboard">Dashboard</a>
          <a className="nav-link active" href="/history">Attendance History</a>
          <a className="nav-link" href="/summary">Attendance Summary</a>
          <a className="nav-link" href="/scan">QR Scanner</a>
        </nav>

        <a className="logout-link" href="/">Log Out</a>
      </aside>

      <section className="dashboard-content">
        <header className="dashboard-header">
          <div>
            <p className="welcome-label">FACULTY PORTAL</p>
            <h1>Attendance History</h1>
            <p className="dashboard-subtitle">
              Attendance records of Sherilyn Tobias.
            </p>
          </div>
          <div className="faculty-avatar">ST</div>
        </header>

        <section className="recent-section">
          <div className="section-heading">
            <div>
              <h2>Attendance Records</h2>
              <p className="section-description">
                View your recorded class attendance.
              </p>
            </div>
            <p className="section-description">
              Total Records: {records.length}
            </p>
          </div>

          <div className="history-table-wrap">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Record ID</th>
                  <th>Faculty Name</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {records.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center">
                      No attendance records yet.
                    </td>
                  </tr>
                ) : (
                  records.map((record) => (
                    <tr key={record.recordId}>
                      <td>{record.recordId}</td>
                      <td>{record.facultyName}</td>
                      <td>{record.date}</td>
                      <td>{record.time}</td>
                      <td>
                        <span
                          className={`status-badge status-${record.status.toLowerCase()}`}
                        >
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}

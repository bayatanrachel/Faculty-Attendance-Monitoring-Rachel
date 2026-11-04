"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "faculty-attendance-records";

const statusLabels = {
  P: "Present",
  L: "Late",
  A: "Absent",
  E: "Excused",
  Present: "Present",
  Late: "Late",
  Absent: "Absent",
  Excused: "Excused",
};

const attendanceStats = [
  { label: "Present", color: "present", note: "On-time attendance" },
  { label: "Late", color: "late", note: "Late attendance" },
  { label: "Absent", color: "absent", note: "No attendance record" },
  { label: "Excused", color: "excused", note: "Excused records" },
];

export default function Dashboard() {
  const [records, setRecords] = useState([]);

  useEffect(() => {
    function loadRecords() {
      try {
        const saved = JSON.parse(
          localStorage.getItem(STORAGE_KEY) || "[]"
        );
        setRecords(Array.isArray(saved) ? saved : []);
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

  const stats = attendanceStats.map((stat) => ({
    ...stat,
    value: records.filter(
      (record) => statusLabels[record.status] === stat.label
    ).length,
  }));

  const recentRecords = [...records].reverse().slice(0, 5);

  return (
    <main className="dashboard-page">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="logo-icon">QR</div>
          <span>FACULTY<br />ATTENDANCE</span>
        </div>

        <div className="faculty-profile">
          <div className="faculty-avatar">ST</div>
          <div className="faculty-profile-copy">
            <strong>Sherilyn Tobias</strong>
            <span>Faculty Member</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <a className="nav-link active" href="/dashboard">Dashboard</a>
          <a className="nav-link" href="/history">Attendance History</a>
          <a className="nav-link" href="/summary">Attendance Summary</a>
          <a className="nav-link" href="/scan">QR Scanner</a>
        </nav>

        <a className="logout-link" href="/">Log Out</a>
      </aside>

      <section className="dashboard-content">
        <header className="dashboard-header">
          <div>
            <p className="welcome-label">FACULTY PORTAL</p>
            <h1>Welcome, Sherilyn Tobias!</h1>
            <p className="dashboard-subtitle">
              Here is your faculty attendance overview.
            </p>
          </div>
          <div className="faculty-avatar">ST</div>
        </header>

        <section className="overview-section">
          <h2>Attendance Overview</h2>
          <p className="section-description">
            Overview of your recorded class attendance.
          </p>

          <div className="stats-grid">
            {stats.map((stat) => (
              <article className="stat-card" key={stat.label}>
                <div className={`stat-indicator ${stat.color}`} />
                <p>{stat.label}</p>
                <h3>{stat.value}</h3>
                <span>{stat.note}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="recent-section">
          <div className="section-heading">
            <div>
              <h2>Recent Attendance</h2>
              <p className="section-description">
                Latest 5 records from the attendance sheet.
              </p>
            </div>
            <a href="/history" className="view-all">View History</a>
          </div>

          <div className="history-table-wrap">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Faculty Name</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {recentRecords.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center">
                      No attendance records yet.
                    </td>
                  </tr>
                ) : (
                  recentRecords.map((record, index) => {
                    const status =
                      statusLabels[record.status] || record.status;

                    return (
                      <tr key={record.recordId || record.id || index}>
                        <td>{record.facultyName}</td>
                        <td>{record.date}</td>
                        <td>{record.time}</td>
                        <td>
                          <span
                            className={`status-badge status-${String(
                              status
                            ).toLowerCase()}`}
                          >
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        <footer className="dashboard-footer">
          QR Code-Based Attendance Monitoring System
        </footer>
      </section>
    </main>
  );
    }

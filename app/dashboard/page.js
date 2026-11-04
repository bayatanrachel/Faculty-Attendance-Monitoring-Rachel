
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
  {
    label: "Present",
    color: "present",
    icon: "✓",
    note: "On-time attendance",
  },
  {
    label: "Late",
    color: "late",
    icon: "◷",
    note: "Late attendance",
  },
  {
    label: "Absent",
    color: "absent",
    icon: "×",
    note: "No attendance record",
  },
  {
    label: "Excused",
    color: "excused",
    icon: "ⓘ",
    note: "Excused records",
  },
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

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <main className="dashboard-page">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="logo-icon">QR</div>
          <span>
            FACULTY
            <br />
            ATTENDANCE
          </span>
        </div>

        <div className="faculty-profile">
          <div className="faculty-avatar">ST</div>
          <div className="faculty-profile-copy">
            <strong>Sherilyn Tobias</strong>
            <span>Faculty Member</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <a className="nav-link active" href="/dashboard">
            ◫ <span>Dashboard</span>
          </a>
          <a className="nav-link" href="/history">
            ▤ <span>Attendance History</span>
          </a>
          <a className="nav-link" href="/summary">
            ▥ <span>Attendance Summary</span>
          </a>
          <a className="nav-link" href="/scan">
            ▦ <span>QR Scanner</span>
          </a>
        </nav>

        <a className="logout-link" href="/">
          ↪ <span>Log Out</span>
        </a>
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

          <div className="header-profile">
            <div className="faculty-avatar">ST</div>
          </div>
        </header>

        <section className="dashboard-date">
          <span className="date-icon">▣</span>
          <div>
            <strong>Today</strong>
            <p>{today}</p>
          </div>
        </section>

        <section className="overview-section">
          <div className="section-heading">
            <div>
              <h2>Attendance Overview</h2>
              <p className="section-description">
                Overview of your recorded class attendance.
              </p>
            </div>
            <span className="record-count">
              {records.length} Total Records
            </span>
          </div>

          <div className="stats-grid">
            {stats.map((stat) => (
              <article
                className={`stat-card stat-${stat.color}`}
                key={stat.label}
              >
                <div className="stat-card-top">
                  <div className={`stat-icon ${stat.color}`}>
                    {stat.icon}
                  </div>
                  <span className="stat-label">{stat.label}</span>
                </div>

                <h3>{stat.value}</h3>
                <span className="stat-note">{stat.note}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="recent-section">
          <div className="section-heading">
            <div>
              <h2>Recent Attendance</h2>
              <p className="section-description">
                Your latest 5 attendance records.
              </p>
            </div>

            <a href="/history" className="view-all">
              View All Records →
            </a>
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
                      <tr
                        key={record.recordId || record.id || index}
                      >
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

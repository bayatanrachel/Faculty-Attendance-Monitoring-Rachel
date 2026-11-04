"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "faculty-attendance-records";

const summaryItems = [
  { label: "Present", color: "present", barColor: "#6dd6c4" },
  { label: "Late", color: "late", barColor: "#e8bd78" },
  { label: "Absent", color: "absent", barColor: "#e18b91" },
  { label: "Excused", color: "excused", barColor: "#aa9cdb" },
];

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

export default function AttendanceSummary() {
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

  const total = records.length;

  const summary = summaryItems.map((item) => {
    const count = records.filter(
      (record) => statusLabels[record.status] === item.label
    ).length;

    return {
      ...item,
      count,
      percentage: total
        ? Math.round((count / total) * 100)
        : 0,
    };
  });

  return (
    <main className="dashboard-page">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="logo-icon">QR</div>
          <span>FACULTY<br />ATTENDANCE</span>
        </div>

        <nav className="sidebar-nav">
          <a className="nav-link" href="/dashboard">Dashboard</a>
          <a className="nav-link" href="/history">Attendance History</a>
          <a className="nav-link active" href="/summary">Attendance Summary</a>
          <a className="nav-link" href="/scan">QR Scanner</a>
        </nav>

        <a className="logout-link" href="/">Log Out</a>
      </aside>

      <section className="dashboard-content">
        <header className="dashboard-header">
          <div>
            <p className="welcome-label">FACULTY REPORT</p>
            <h1>Attendance Summary</h1>
            <p className="dashboard-subtitle">
              Attendance report for Sherilyn Tobias.
            </p>
          </div>
          <div className="faculty-avatar">ST</div>
        </header>

        <section className="recent-section">
          <p className="welcome-label">RECORD OVERVIEW</p>
          <h2>Overall Attendance Report</h2>
          <p className="section-description">
            Distribution of recorded attendance by status.
          </p>

          <div style={{
            marginTop: "24px",
            padding: "25px",
            background: "#17283e",
            border: "1px solid #293e55",
            borderRadius: "15px"
          }}>
            <p style={{ color: "#9aacc0", fontSize: "13px" }}>
              Total Attendance Records
            </p>
            <h2 style={{ fontSize: "38px", marginTop: "8px" }}>
              {total}
            </h2>
            <p style={{ color: "#9aacc0", fontSize: "12px", marginTop: "5px" }}>
              Records included in this report
            </p>
          </div>

          <div style={{ marginTop: "28px" }}>
            <h2>Attendance Distribution</h2>
            <p className="section-description">
              Percentage and number of records for each status.
            </p>

            <div style={{ marginTop: "22px", display: "grid", gap: "22px" }}>
              {summary.map((item) => (
                <div key={item.label}>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "12px",
                    marginBottom: "9px"
                  }}>
                    <strong style={{ fontSize: "13px" }}>
                      {item.label}
                    </strong>
                    <span style={{ color: "#aebed0", fontSize: "12px" }}>
                      {item.count} records · {item.percentage}%
                    </span>
                  </div>

                  <div style={{
                    height: "11px",
                    background: "#0a1728",
                    borderRadius: "20px",
                    overflow: "hidden"
                  }}>
                    <div style={{
                      width: `${item.percentage}%`,
                      height: "100%",
                      borderRadius: "20px",
                      background: item.barColor
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <footer className="dashboard-footer">
          QR Code-Based Attendance Monitoring System
        </footer>
      </section>
    </main>
  );
}


            


"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LogoutButton from "@/app/components/LogoutButton";

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

function getDateKey(value) {
  if (!value) return "";

  const text = String(value).trim();
  const match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);

  if (match) {
    return `${match[1]}-${String(match[2]).padStart(2, "0")}-${String(
      match[3]
    ).padStart(2, "0")}`;
  }

  return "";
}

function getLocalDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

function mapDatabaseRecord(row) {
  return {
    recordId: row.record_id,
    facultyName: row.faculty_name,
    date: row.date,
    time: row.time,
    status: row.status,
  };
}

export default function Dashboard() {
  const router = useRouter();

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadRecords() {
      try {
        const response = await fetch("/api/attendance", {
          method: "GET",
          cache: "no-store",
        });

        if (response.status === 401) {
          router.replace("/");
          return;
        }

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error || "Unable to load attendance records."
          );
        }

        if (active) {
          const databaseRecords = Array.isArray(result.records)
            ? result.records.map(mapDatabaseRecord)
            : [];

          setRecords(databaseRecords);
          setErrorMessage("");
        }
      } catch (error) {
        if (active) {
          setErrorMessage(
            error.message || "Unable to connect to the attendance database."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadRecords();

    function handleFocus() {
      loadRecords();
    }

    window.addEventListener("focus", handleFocus);

    return () => {
      active = false;
      window.removeEventListener("focus", handleFocus);
    };
  }, [router]);

  const stats = attendanceStats.map((stat) => ({
    ...stat,
    value: records.filter(
      (record) => statusLabels[record.status] === stat.label
    ).length,
  }));

  const recentRecords = [...records]
    .sort((a, b) => {
      const dateComparison = String(b.date).localeCompare(String(a.date));

      if (dateComparison !== 0) return dateComparison;

      return String(b.time).localeCompare(String(a.time));
    })
    .slice(0, 5);

  const today = new Date();

  const formattedDate = today.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const weeklyActivity = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));

    const key = getLocalDateKey(date);

    const count = records.filter(
      (record) => getDateKey(record.date) === key
    ).length;

    return {
      label: date.toLocaleDateString("en-US", {
        weekday: "short",
      }),
      count,
      key,
    };
  });

  const maxActivity = Math.max(
    1,
    ...weeklyActivity.map((day) => day.count)
  );

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

        <p className="sidebar-caption">MAIN MENU</p>

        <nav className="sidebar-nav">
          <a className="nav-link active" href="/dashboard">
            <span className="nav-icon">▦</span>
            <span>Dashboard</span>
            <span className="nav-arrow">›</span>
          </a>

          <a className="nav-link" href="/history">
            <span className="nav-icon">▤</span>
            <span>Attendance History</span>
          </a>

          <a className="nav-link" href="/summary">
            <span className="nav-icon">▥</span>
            <span>Attendance Summary</span>
          </a>

          <a className="nav-link" href="/scan">
            <span className="nav-icon">▣</span>
            <span>QR Scanner</span>
          </a>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-help">
            <span className="help-icon">?</span>
            <div>
              <strong>Faculty Portal</strong>
              <span>Attendance management</span>
            </div>
          </div>

          <LogoutButton />
        </div>
      </aside>

      <section className="dashboard-content">
        <header className="dashboard-topbar">
          <div className="topbar-label">
            <span className="topbar-dot" />
            FACULTY ATTENDANCE SYSTEM
          </div>

          <div className="topbar-right">
            <span className="system-status">
              <span className="online-dot" />
              System Overview
            </span>
            <div className="topbar-avatar">ST</div>
          </div>
        </header>

        <div className="dashboard-main">
          {errorMessage && (
            <p
              role="alert"
              style={{
                color: "#ff8b8b",
                padding: "12px",
                marginBottom: "16px",
              }}
            >
              {errorMessage}
            </p>
          )}

          <section className="welcome-banner">
            <div className="welcome-content">
              <span className="welcome-label">WELCOME BACK</span>
              <h1>Sherilyn Tobias<span>.</span></h1>
              <p>
                Stay updated with your faculty attendance and class records.
              </p>

              <div className="welcome-date">
                <span>▣</span>
                {formattedDate}
              </div>
            </div>

            <div className="welcome-art" aria-hidden="true">
              <div className="art-orbit orbit-one" />
              <div className="art-orbit orbit-two" />
              <div className="art-glow" />
              <div className="art-card">
                <span className="art-card-icon">QR</span>
                <strong>Attendance</strong>
                <small>Monitoring Portal</small>
                <div className="art-card-line" />
                <div className="art-card-line short" />
              </div>
              <div className="art-floating art-floating-one">✓</div>
              <div className="art-floating art-floating-two">⌁</div>
            </div>
          </section>

          <section className="overview-section">
            <div className="section-heading">
              <div>
                <span className="section-eyebrow">YOUR RECORDS</span>
                <h2>Attendance Overview</h2>
                <p className="section-description">
                  A quick look at your recorded attendance.
                </p>
              </div>

              <div className="record-count">
                <span className="record-count-icon">▤</span>
                <span>
                  <strong>{loading ? "..." : records.length}</strong>
                  <small>Total Records</small>
                </span>
              </div>
            </div>

            <div className="stats-grid">
              {stats.map((stat, index) => (
                <article
                  className={`stat-card stat-${stat.color}`}
                  key={stat.label}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="stat-card-top">
                    <div className={`stat-icon ${stat.color}`}>
                      {stat.icon}
                    </div>
                    <span className="stat-label">{stat.label}</span>
                    <span className="stat-decoration">{stat.icon}</span>
                  </div>

                  <h3>{loading ? "..." : stat.value}</h3>
                  <p className="stat-note">{stat.note}</p>

                  <div className="stat-progress">
                    <span
                      style={{
                        width: `${
                          records.length
                            ? (stat.value / records.length) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="activity-section">
            <div className="section-heading">
              <div>
                <span className="section-eyebrow">LAST 7 DAYS</span>
                <h2>Attendance Activity</h2>
                <p className="section-description">
                  Daily attendance records for the past seven days.
                </p>
              </div>

              <span className="activity-total">
                {weeklyActivity.reduce((sum, day) => sum + day.count, 0)}{" "}
                <small>records this week</small>
              </span>
            </div>

            <div className="activity-chart">
              {weeklyActivity.map((day, index) => (
                <div className="chart-column" key={day.key}>
                  <span className="chart-value">{day.count}</span>
                  <div className="chart-track">
                    <div
                      className={`chart-bar ${
                        index === 6 ? "chart-bar-today" : ""
                      }`}
                      style={{
                        height: `${
                          day.count === 0
                            ? 5
                            : Math.max(
                                12,
                                (day.count / maxActivity) * 100
                              )
                        }%`,
                        animationDelay: `${index * 90}ms`,
                      }}
                    />
                  </div>
                  <span className="chart-day">{day.label}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="recent-section">
            <div className="section-heading">
              <div>
                <span className="section-eyebrow">LATEST UPDATES</span>
                <h2>Recent Attendance</h2>
                <p className="section-description">
                  Your five most recent attendance records.
                </p>
              </div>

              <a href="/history" className="view-all">
                View All Records <span>→</span>
              </a>
            </div>

            <div className="history-table-wrap">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>FACULTY NAME</th>
                    <th>DATE</th>
                    <th>TIME</th>
                    <th>STATUS</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="4">
                        <div className="empty-records">
                          <strong>Loading attendance records...</strong>
                        </div>
                      </td>
                    </tr>
                  ) : recentRecords.length === 0 ? (
                    <tr>
                      <td colSpan="4">
                        <div className="empty-records">
                          <div className="empty-icon">▤</div>
                          <strong>No attendance records yet</strong>
                          <p>
                            Your latest attendance records will appear here
                            after a successful scan.
                          </p>
                          <a href="/scan" className="empty-action">
                            Open QR Scanner →
                          </a>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    recentRecords.map((record, index) => {
                      const status =
                        statusLabels[record.status] || record.status;

                      const statusClass = String(status)
                        .toLowerCase()
                        .replace(/\s+/g, "-");

                      return (
                        <tr
                          key={record.recordId || index}
                          className="record-row"
                        >
                          <td>
                            <div className="faculty-cell">
                              <span className="table-avatar">ST</span>
                              <strong>
                                {record.facultyName || "Sherilyn Tobias"}
                              </strong>
                            </div>
                          </td>
                          <td>{record.date || "—"}</td>
                          <td>{record.time || "—"}</td>
                          <td>
                            <span
                              className={`status-badge status-${statusClass}`}
                            >
                              <span className="status-dot" />
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
            <span>QR Code-Based Attendance Monitoring System</span>
            <span>Faculty Portal <b>•</b> Dashboard</span>
          </footer>
        </div>
      </section>
    </main>
  );
}


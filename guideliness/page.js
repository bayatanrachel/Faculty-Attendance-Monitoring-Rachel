
"use client";

const statuses = [
  {
    code: "P",
    name: "Present",
    description: "The faculty member scanned within the allowed attendance period.",
    color: "#6dd6c4",
    background: "rgba(109, 214, 196, 0.10)",
    border: "rgba(109, 214, 196, 0.30)",
  },
  {
    code: "L",
    name: "Late",
    description: "The faculty member scanned after the 15-minute grace period.",
    color: "#e8bd78",
    background: "rgba(232, 189, 120, 0.10)",
    border: "rgba(232, 189, 120, 0.30)",
  },
  {
    code: "A",
    name: "Absent",
    description: "No attendance record was found after the attendance period.",
    color: "#e18b91",
    background: "rgba(225, 139, 145, 0.10)",
    border: "rgba(225, 139, 145, 0.30)",
  },
  {
    code: "E",
    name: "Excused",
    description: "A separate status used for an approved or excused absence.",
    color: "#aa9cdb",
    background: "rgba(170, 156, 219, 0.10)",
    border: "rgba(170, 156, 219, 0.30)",
  },
];

const schedule = [
  {
    time: "1:00 PM – 1:15 PM",
    label: "Present",
    description: "Scan within the first 15 minutes of the class.",
    color: "#6dd6c4",
  },
  {
    time: "1:16 PM – 1:59 PM",
    label: "Late",
    description: "Scans made after the 15-minute grace period are marked late.",
    color: "#e8bd78",
  },
  {
    time: "2:00 PM onwards",
    label: "Absent",
    description: "If there is no attendance record by this time, the faculty member is marked absent.",
    color: "#e18b91",
  },
];

export default function AttendanceGuidelines() {
  return (
    <div className="dashboard-page">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">A</div>
          <div>
            <h2>Faculty Attendance</h2>
            <span>Monitoring System</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <a href="/dashboard" className="nav-link">Dashboard</a>
          <a href="/history" className="nav-link">Attendance History</a>
          <a href="/summary" className="nav-link">Attendance Summary</a>
          <a href="/guidelines" className="nav-link active">Attendance Guidelines</a>
        </nav>

        <div className="sidebar-bottom">
          <a href="/" className="logout-link">← Back to Login</a>
        </div>
      </aside>

      <main className="dashboard-content">
        <header className="dashboard-header">
          <div>
            <p className="welcome-label">SYSTEM INFORMATION</p>
            <h1>Attendance Guidelines</h1>
            <p className="dashboard-subtitle">
              Understand the attendance status labels and classroom scanning schedule.
            </p>
          </div>
          <div className="faculty-avatar">ST</div>
        </header>

        <section className="recent-section">
          <div className="guidelines-heading">
            <div>
              <p className="welcome-label">STATUS REFERENCE</p>
              <h2>Status Legend</h2>
              <p className="section-description">
                These labels explain the meaning of each attendance status.
              </p>
            </div>
            <span className="info-chip">4 Status Types</span>
          </div>

          <div className="guidelines-status-grid">
            {statuses.map((status) => (
              <article
                key={status.code}
                className="guideline-status-card"
                style={{
                  background: status.background,
                  borderColor: status.border,
                }}
              >
                <div
                  className="guideline-status-code"
                  style={{
                    color: status.color,
                    borderColor: status.border,
                  }}
                >
                  {status.code}
                </div>
                <div>
                  <h3 style={{ color: status.color }}>{status.name}</h3>
                  <p>{status.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="recent-section schedule-section">
          <div className="guidelines-heading">
            <div>
              <p className="welcome-label">CLASSROOM SCANNING</p>
              <h2>Attendance Schedule</h2>
              <p className="section-description">
                The attendance monitoring period is from 1:00 PM to 2:00 PM.
              </p>
            </div>
            <span className="info-chip">1:00 PM – 2:00 PM</span>
          </div>

          <div className="schedule-timeline">
            {schedule.map((item, index) => (
              <article className="schedule-item" key={item.label}>
                <div className="timeline-marker">
                  <span style={{ background: item.color }} />
                  {index !== schedule.length - 1 && (
                    <div className="timeline-line" />
                  )}
                </div>

                <div className="schedule-card">
                  <div className="schedule-card-top">
                    <span className="schedule-time">{item.time}</span>
                    <span
                      className="schedule-label"
                      style={{
                        color: item.color,
                        borderColor: `${item.color}55`,
                        background: `${item.color}18`,
                      }}
                    >
                      {item.label}
                    </span>
                  </div>
                  <p>{item.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="guideline-note">
          <div className="note-icon">i</div>
          <div>
            <h3>Important Reminder</h3>
            <p>
              Attendance status is based on the recorded QR scan time.
              The Absent status applies when no attendance record is found
              after 2:00 PM. Excused is a separate status and is not
              automatically assigned by the scanning schedule.
            </p>
          </div>
        </section>

        <footer className="dashboard-footer">
          Faculty Attendance Monitoring System
        </footer>
      </main>

      <style jsx>{`
        .guidelines-heading {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 22px;
        }

        .guidelines-heading h2 {
          margin: 5px 0 8px;
          font-size: 22px;
          color: #f1f4f8;
        }

        .info-chip {
          white-space: nowrap;
          padding: 8px 12px;
          border: 1px solid rgba(109, 214, 196, 0.25);
          border-radius: 20px;
          color: #6dd6c4;
          background: rgba(109, 214, 196, 0.08);
          font-size: 11px;
          font-weight: 700;
        }

        .guidelines-status-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .guideline-status-card {
          display: flex;
          align-items: flex-start;
          gap: 15px;
          padding: 20px;
          border: 1px solid;
          border-radius: 14px;
        }

        .guideline-status-code {
          display: flex;
          flex: 0 0 42px;
          width: 42px;
          height: 42px;
          align-items: center;
          justify-content: center;
          border: 1px solid;
          border-radius: 12px;
          font-size: 19px;
          font-weight: 800;
        }

        .guideline-status-card h3 {
          margin: 2px 0 7px;
          font-size: 15px;
        }

        .guideline-status-card p,
        .schedule-card p,
        .guideline-note p {
          margin: 0;
          color: #a6b0c0;
          font-size: 12px;
          line-height: 1.7;
        }

        .schedule-section {
          margin-top: 28px;
        }

        .schedule-timeline {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .schedule-item {
          display: flex;
          gap: 15px;
        }

        .timeline-marker {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 18px;
          flex-shrink: 0;
        }

        .timeline-marker span {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          margin-top: 22px;
          box-shadow: 0 0 12px currentColor;
        }

        .timeline-line {
          width: 2px;
          flex: 1;
          min-height: 65px;
          background: #29364a;
        }

        .schedule-card {
          flex: 1;
          margin-bottom: 13px;
          padding: 17px 19px;
          border: 1px solid #29364a;
          border-radius: 13px;
          background: #151f30;
        }

        .schedule-card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 9px;
        }

        .schedule-time {
          color: #f1f4f8;
          font-size: 14px;
          font-weight: 700;
        }

        .schedule-label {
          padding: 5px 10px;
          border: 1px solid;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 700;
        }

        .guideline-note {
          display: flex;
          gap: 14px;
          margin-top: 20px;
          padding: 20px;
          border: 1px solid rgba(109, 214, 196, 0.25);
          border-radius: 14px;
          background: rgba(109, 214, 196, 0.06);
        }

        .note-icon {
          display: flex;
          flex: 0 0 28px;
          width: 28px;
          height: 28px;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          color: #6dd6c4;
          background: rgba(109, 214, 196, 0.15);
          font-weight: 800;
        }

        .guideline-note h3 {
          margin: 3px 0 8px;
          color: #6dd6c4;
          font-size: 14px;
        }

        @media (max-width: 700px) {
          .guidelines-status-grid {
            grid-template-columns: 1fr;
          }

          .guidelines-heading {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}


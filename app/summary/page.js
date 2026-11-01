
const summary = [
  { label: "Present", count: 0, color: "present" },
  { label: "Late", count: 0, color: "late" },
  { label: "Absent", count: 0, color: "absent" },
  { label: "Excused", count: 0, color: "excused" },
];

export default function AttendanceSummary() {
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
        </nav>

        <a className="logout-link" href="/">Log Out</a>
      </aside>

      <section className="dashboard-content">
        <header className="dashboard-header">
          <div>
            <p className="welcome-label">FACULTY PORTAL</p>
            <h1>Attendance Summary</h1>
            <p className="dashboard-subtitle">
              Attendance overview for Sherilyn Tobias.
            </p>
          </div>
          <div className="faculty-avatar">ST</div>
        </header>

        <section className="overview-section">
          <h2>Attendance Statistics</h2>
          <p className="section-description">
            Total recorded attendance by status.
          </p>

          <div className="stats-grid">
            {summary.map((item) => (
              <article className="stat-card" key={item.label}>
                <div className={`stat-indicator ${item.color}`} />
                <p>{item.label}</p>
                <h3>{item.count}</h3>
                <span>Total records</span>
              </article>
            ))}
          </div>
        </section>

        <section className="recent-section">
          <h2>Overall Attendance</h2>
          <div className="empty-records">
            <h3>Summary is not available yet</h3>
            <p>Attendance statistics will appear here once records are connected.</p>
          </div>
        </section>
      </section>
    </main>
  );
}


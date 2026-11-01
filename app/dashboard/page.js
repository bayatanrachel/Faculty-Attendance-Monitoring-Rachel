
const attendanceStats = [
  { label: "Present", value: "0", color: "present" },
  { label: "Late", value: "0", color: "late" },
  { label: "Absent", value: "0", color: "absent" },
  { label: "Excused", value: "0", color: "excused" },
];

export default function Dashboard() {
  return (
    <main className="dashboard-page">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="logo-icon">QR</div>
          <span>FACULTY<br />ATTENDANCE</span>
        </div>

        <nav className="sidebar-nav">
          <a className="nav-link active" href="/dashboard">Dashboard</a>
          <a className="nav-link" href="/history">Attendance History</a>
          <a className="nav-link" href="/summary">Attendance Summary</a>
        </nav>

        <a className="logout-link" href="/">Log Out</a>
      </aside>

      <section className="dashboard-content">
        <header className="dashboard-header">
          <div>
            <p className="welcome-label">FACULTY PORTAL</p>
            <h1>Welcome, Sherilyn Tobias!</h1>
            <p className="dashboard-subtitle">
              Here's an overview of your attendance records.
            </p>
          </div>
          <div className="faculty-avatar">ST</div>
        </header>

        <section className="overview-section">
          <h2>Attendance Overview</h2>
          <p className="section-description">
            Summary of your recorded class attendance.
          </p>

          <div className="stats-grid">
            {attendanceStats.map((stat) => (
              <article className="stat-card" key={stat.label}>
                <div className={`stat-indicator ${stat.color}`} />
                <p>{stat.label}</p>
                <h3>{stat.value}</h3>
                <span>Total records</span>
              </article>
            ))}
          </div>
        </section>

        <section className="recent-section">
          <div className="section-heading">
            <div>
              <h2>Recent Attendance</h2>
              <p className="section-description">
                Your latest attendance activity.
              </p>
            </div>
            <a href="/history" className="view-all">View History</a>
          </div>

          <div className="empty-records">
            <div className="empty-icon">QR</div>
            <h3>No attendance records yet</h3>
            <p>Your attendance records will appear here once available.</p>
          </div>
        </section>

        <footer className="dashboard-footer">
          QR Code-Based Attendance Monitoring System
        </footer>
      </section>
    </main>
  );
}


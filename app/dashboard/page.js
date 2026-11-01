

const attendanceStats = [
  { label: "Present", value: "0", color: "present", note: "On-time attendance" },
  { label: "Late", value: "0", color: "late", note: "Late attendance" },
  { label: "Absent", value: "0", color: "absent", note: "No attendance record" },
  { label: "Excused", value: "0", color: "excused", note: "Excused records" },
];

export default function Dashboard() {
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
            Summary of your recorded class attendance.
          </p>

          <div className="stats-grid">
            {attendanceStats.map((stat) => (
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
                Your latest attendance activity.
              </p>
            </div>
            <a href="/history" className="view-all">View History</a>
          </div>

          <div className="empty-records">
            <div className="empty-icon">QR</div>
            <h3>No attendance records yet</h3>
            <p>
              Your attendance records will appear here once the database
              connection is completed.
            </p>
          </div>
        </section>

        <footer className="dashboard-footer">
          QR Code-Based Attendance Monitoring System
        </footer>
      </section>
    </main>
  );
}

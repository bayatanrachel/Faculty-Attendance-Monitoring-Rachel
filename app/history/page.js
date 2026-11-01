
const records = [];

export default function AttendanceHistory() {
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
          </div>

          <div className="history-table-wrap">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Record ID</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {records.length > 0 ? (
                  records.map((record) => (
                    <tr key={record.id}>
                      <td>{record.id}</td>
                      <td>{record.date}</td>
                      <td>{record.time}</td>
                      <td>{record.status}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="history-empty">
                      No attendance records available yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}


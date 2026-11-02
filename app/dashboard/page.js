
const records = [
  { id: "9bd18ea9", facultyName: "Sherilyn Tobias", date: "10/30/26", time: "01:00", status: "P" },
  { id: "AE1024", facultyName: "Sherilyn Tobias", date: "10/30/26", time: "01:09", status: "P" },
  { id: "AE1025", facultyName: "Sherilyn Tobias", date: "10/30/26", time: "01:12", status: "P" },
  { id: "AE1023", facultyName: "Sherilyn Tobias", date: "10/30/26", time: "01:14", status: "P" },
  { id: "AE1022", facultyName: "Sherilyn Tobias", date: "10/30/26", time: "01:24", status: "L" },
  { id: "c347fa3d", facultyName: "Sherilyn Tobias", date: "10/30/26", time: "01:33", status: "L" },
  { id: "91d7b9ec", facultyName: "Sherilyn Tobias", date: "10/30/26", time: "01:40", status: "L" },
  { id: "dedf5c69", facultyName: "Sherilyn Tobias", date: "10/30/26", time: "02:00", status: "A" },
  { id: "8430687e-f808-43ee-b0d0-c3dd9e2aaae1", facultyName: "Sherilyn Tobias", date: "11/01/26", time: "01:00", status: "P" },
  { id: "8f15d145-10bf-4862-9d42-f98bccdd85f7", facultyName: "Sherilyn Tobias", date: "11/02/26", time: "01:13", status: "P" },
];

const statusLabels = {
  P: "Present",
  L: "Late",
  A: "Absent",
  E: "Excused",
};

const attendanceStats = [
  { label: "Present", color: "present", note: "On-time attendance" },
  { label: "Late", color: "late", note: "Late attendance" },
  { label: "Absent", color: "absent", note: "No attendance record" },
  { label: "Excused", color: "excused", note: "Excused records" },
].map((stat) => ({
  ...stat,
  value: records.filter((record) => statusLabels[record.status] === stat.label).length,
}));

export default function Dashboard() {
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
                {recentRecords.map((record) => (
                  <tr key={record.id}>
                    <td>{record.facultyName}</td>
                    <td>{record.date}</td>
                    <td>{record.time}</td>
                    <td>
                      <span className={`status-badge status-${record.status.toLowerCase()}`}>
                        {statusLabels[record.status] || record.status}
                      </span>
                    </td>
                  </tr>
                ))}
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


                  export const dynamic = "force-dynamic";

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

function getStatus(status) {
  if (status === "P") return "Present";
  if (status === "L") return "Late";
  if (status === "A") return "Absent";
  if (status === "E") return "Excused";
  return status;
}

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
                  <th>Faculty Name</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id}>
                    <td>{record.id}</td>
                    <td>{record.facultyName}</td>
                    <td>{record.date}</td>
                    <td>{record.time}</td>
                    <td>{getStatus(record.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}

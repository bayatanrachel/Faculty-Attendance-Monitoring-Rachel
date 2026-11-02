

const records = [
  { id: "9bd18ea9", status: "P" },
  { id: "AE1024", status: "P" },
  { id: "AE1025", status: "P" },
  { id: "AE1023", status: "P" },
  { id: "AE1022", status: "L" },
  { id: "c347fa3d", status: "L" },
  { id: "91d7b9ec", status: "L" },
  { id: "dedf5c69", status: "A" },
  { id: "8430687e-f808-43ee-b0d0-c3dd9e2aaae1", status: "P" },
  { id: "8f15d145-10bf-4862-9d42-f98bccdd85f7", status: "P" },
];

const total = records.length;

const summary = [
  { label: "Present", code: "P", color: "present" },
  { label: "Late", code: "L", color: "late" },
  { label: "Absent", code: "A", color: "absent" },
  { label: "Excused", code: "E", color: "excused" },
].map((item) => {
  const count = records.filter((record) => record.status === item.code).length;
  return {
    ...item,
    count,
    percentage: total ? Math.round((count / total) * 100) : 0,
  };
});

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
                <div key={item.code}>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "12px",
                    marginBottom: "9px"
                  }}>
                    <strong style={{ fontSize: "13px" }}>{item.label}</strong>
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
                      background:
                        item.color === "present" ? "#6dd6c4" :
                        item.color === "late" ? "#e8bd78" :
                        item.color === "absent" ? "#e18b91" : "#aa9cdb"
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

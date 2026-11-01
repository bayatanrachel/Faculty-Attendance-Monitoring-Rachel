
export default function Home() {
  return (
    <main className="login-page">
      <section className="login-card">
        <div className="logo">
          <div className="logo-icon">QR</div>
          <span>FACULTY ATTENDANCE</span>
        </div>

        <div className="login-heading">
          <p className="welcome-label">WELCOME BACK</p>
          <h1>Faculty Login</h1>
          <p className="subtitle">
            Sign in to access your attendance dashboard.
          </p>
        </div>

        <form className="login-form">
          <label htmlFor="facultyId">Faculty ID Number</label>
          <input
            id="facultyId"
            type="text"
            placeholder="Enter your faculty ID"
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            placeholder="Enter your password"
            required
          />

          <button type="submit">Sign In</button>
        </form>

        <p className="login-note">
          Authorized faculty access only.
        </p>
      </section>

      <footer className="login-footer">
        QR Code-Based Attendance Monitoring System
      </footer>
    </main>
  );
}


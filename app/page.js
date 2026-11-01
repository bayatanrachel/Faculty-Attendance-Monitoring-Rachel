
"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  function handleLogin(event) {
    event.preventDefault();

    const facultyId = event.target.facultyId.value.trim();
    const password = event.target.password.value.trim();

    if (!facultyId || !password) {
      return;
    }

    router.push("/dashboard");
  }

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
            Welcome, Sherilyn Tobias. Sign in to access your dashboard.
          </p>
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          <label htmlFor="facultyId">Faculty ID Number</label>
          <input
            id="facultyId"
            name="facultyId"
            type="text"
            placeholder="Enter your faculty ID"
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
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


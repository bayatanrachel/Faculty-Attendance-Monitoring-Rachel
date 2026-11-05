
"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

async function handleLogin(event) {
  event.preventDefault();

  const facultyId = event.target.facultyId.value.trim();
  const password = event.target.password.value;

  if (!facultyId || !password) {
    alert("Please enter your Faculty ID and password.");
    return;
  }

  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        facultyId,
        password,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      alert(result.error || "Login failed.");
      return;
    }

    router.push("/dashboard");
  } catch {
    alert("Unable to connect. Please try again.");
  }
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
            Sign in to access your faculty attendance dashboard.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "13px",
            padding: "14px",
            marginBottom: "25px",
            border: "1px solid #293e55",
            borderRadius: "13px",
            background: "#0d1a2b"
          }}
        >
          <div className="faculty-avatar">ST</div>
          <div>
            <strong style={{ display: "block", color: "#e8eff6", fontSize: "14px" }}>
              Sherilyn Tobias
            </strong>
            <span style={{ display: "block", color: "#9aacc0", fontSize: "11px", marginTop: "4px" }}>
              Registered Faculty Member
            </span>
          </div>
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


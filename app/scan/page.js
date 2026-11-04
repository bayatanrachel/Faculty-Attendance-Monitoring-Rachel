
"use client";

import { useEffect, useRef, useState } from "react";

const KEY = "faculty-attendance-records";

const SCHEDULES = Array.from({ length: 17 }, (_, i) => {
  const hour = i + 7;
  return `${String(hour).padStart(2, "0")}:00`;
});

const styles = {
  page: {
    minHeight: "100vh",
    background: "#091321",
    color: "#edf4ff",
    padding: "28px 18px",
    fontFamily: "Arial, sans-serif",
  },
  container: { maxWidth: "950px", margin: "0 auto" },
  link: { color: "#83cfff", textDecoration: "none" },
  heading: { fontSize: "30px", margin: "22px 0 8px" },
  muted: { color: "#9aacc0", lineHeight: 1.6 },
  panel: {
    background: "#14253a",
    border: "1px solid #2b4059",
    borderRadius: "16px",
    padding: "22px",
    marginTop: "22px",
  },
  button: {
    background: "#2678db",
    color: "white",
    border: 0,
    borderRadius: "9px",
    padding: "13px 20px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  video: {
    width: "100%",
    maxHeight: "430px",
    objectFit: "cover",
    borderRadius: "12px",
    background: "#050b13",
  },
  input: {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #405671",
    background: "#0b192a",
    color: "white",
    marginTop: "8px",
  },
};

export default function ScanPage() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const busyRef = useRef(false);
  const frameRef = useRef(null);

  const [cameraOn, setCameraOn] = useState(false);
  const [message, setMessage] = useState("Ready to scan.");
  const [error, setError] = useState("");
  const [records, setRecords] = useState([]);
  const [detectorSupported, setDetectorSupported] = useState(true);

  function loadRecords() {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || "[]");
      setRecords(Array.isArray(saved) ? saved : []);
    } catch {
      setRecords([]);
    }
  }

  function stopCamera() {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOn(false);
  }

  function saveRecord(raw) {
    if (busyRef.current) return;

    let qr;

    try {
      qr = JSON.parse(raw);
    } catch {
      setError("Invalid QR code. Please scan the correct faculty QR.");
      return;
    }

    const facultyName = String(qr.facultyName || "").trim();
    const classStart = String(qr.classStart || "");

    if (!facultyName || !SCHEDULES.includes(classStart)) {
      setError(
        "Invalid QR. It must contain facultyName and a schedule from 7 AM to 11 PM."
      );
      return;
    }

    const now = new Date();
    const [hour, minute] = classStart.split(":").map(Number);

    const start = new Date(now);
    start.setHours(hour, minute, 0, 0);

    const cutoff = new Date(start.getTime() + 15 * 60 * 1000);

    if (now < start) {
      setError("Hindi pa nagsisimula ang scheduled class.");
      return;
    }

    const date = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
    ].join("-");

    let saved = [];

    try {
      saved = JSON.parse(localStorage.getItem(KEY) || "[]");
      if (!Array.isArray(saved)) saved = [];
    } catch {
      saved = [];
    }

    const duplicate = saved.some(
      (record) =>
        record.facultyName === facultyName &&
        record.date === date &&
        record.classStart === classStart
    );

    if (duplicate) {
      setError("May existing attendance record na para sa class na ito.");
      return;
    }

    busyRef.current = true;

    const record = {
      recordId: crypto.randomUUID().slice(0, 8),
      facultyName,
      time: now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      date: now.toLocaleDateString("en-US"),
      status: now <= cutoff ? "Present" : "Late",
      classStart,
    };

    const updated = [record, ...saved];

    localStorage.setItem(KEY, JSON.stringify(updated));
    setRecords(updated);
    setMessage(`${record.status}! Attendance successfully recorded.`);
    setError("");

    stopCamera();
    busyRef.current = false;
  }

  async function startCamera() {
    setError("");
    setMessage("Opening camera...");

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera access is unavailable. Use an updated browser over HTTPS.");
      return;
    }

    if (!("BarcodeDetector" in window)) {
      setDetectorSupported(false);
      setError("QR scanning is not supported by this browser.");
      return;
    }

    try {
      const detector = new window.BarcodeDetector({
        formats: ["qr_code"],
      });

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });

      streamRef.current = stream;
      setCameraOn(true);
      setMessage("Camera active. Point it at the faculty QR code.");

      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      async function scan() {
        if (!streamRef.current || busyRef.current) return;

        try {
          const codes = await detector.detect(videoRef.current);

          if (codes.length > 0) {
            saveRecord(codes[0].rawValue);
          }
        } catch (scanError) {
          console.error(scanError);
        }

        if (streamRef.current) {
          frameRef.current = requestAnimationFrame(scan);
        }
      }

      frameRef.current = requestAnimationFrame(scan);

      stopCamera();
    } catch (cameraError) {
  console.error("CAMERA ERROR:", cameraError);
  setError(`${cameraError.name}: ${cameraError.message}`);
  stopCamera();
}
  }

  useEffect(() => {
    loadRecords();

    window.addEventListener("storage", loadRecords);
    window.addEventListener("focus", loadRecords);

    return () => {
      window.removeEventListener("storage", loadRecords);
      window.removeEventListener("focus", loadRecords);
      streamRef.current?.getTracks().forEach((track) => track.stop());

      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <a href="/dashboard" style={styles.link}>← Back to Dashboard</a>

        <h1 style={styles.heading}>QR Code Scanner</h1>
        <p style={styles.muted}>
          Scan the faculty QR code to record class attendance.
        </p>

        <section style={styles.panel}>
          <h2 style={{ fontSize: "20px", marginBottom: "8px" }}>
            Camera Scanner
          </h2>
          <p style={styles.muted}>
            Use your phone's rear camera to scan the faculty QR code.
          </p>

          <div style={{ marginTop: "20px" }}>
            {cameraOn ? (
              <video ref={videoRef} muted playsInline style={styles.video} />
            ) : (
              <div style={{
                ...styles.video,
                aspectRatio: "16 / 9",
                display: "grid",
                placeItems: "center",
                color: "#9aacc0",
              }}>
                <div style={{ textAlign: "center", padding: "20px" }}>
                  <div style={{ fontSize: "42px" }}>▦</div>
                  Camera preview
                </div>
              </div>
            )}
          </div>

          <div style={{ marginTop: "18px" }}>
            {!cameraOn ? (
              <button onClick={startCamera} style={styles.button}>
                Start Camera
              </button>
            ) : (
              <button
                onClick={stopCamera}
                style={{ ...styles.button, background: "#a43d4a" }}
              >
                Stop Camera
              </button>
            )}
          </div>

          <p style={{ marginTop: "16px", color: "#c8d7e8" }}>
            {message}
          </p>

          {error && (
            <p style={{ color: "#ff929c", marginTop: "10px" }}>
              {error}
            </p>
          )}

          {!detectorSupported && (
            <p style={styles.muted}>
              Try an updated browser that supports QR code detection.
            </p>
          )}
        </section>

        <section style={styles.panel}>
          <h2 style={{ fontSize: "20px", marginBottom: "12px" }}>
            Class Schedule
          </h2>
          <p style={styles.muted}>
            Each hourly class has a 15-minute grace period.
          </p>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
            gap: "10px",
            marginTop: "18px",
          }}>
            {SCHEDULES.map((time) => {
              const hour = Number(time.slice(0, 2));
              const label = `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? "PM" : "AM"}`;

              return (
                <div key={time} style={{
                  background: "#0b192a",
                  border: "1px solid #304761",
                  borderRadius: "9px",
                  padding: "12px",
                  textAlign: "center",
                  fontWeight: "bold",
                }}>
                  {label}
                </div>
              );
            })}
          </div>

          <p style={{ ...styles.muted, marginTop: "16px" }}>
            Present: class start through 15 minutes after.
            <br />
            Late: 16 minutes after class start onward.
          </p>
        </section>

        <section style={styles.panel}>
          <h2 style={{ fontSize: "20px", marginBottom: "14px" }}>
            Latest Attendance
          </h2>

          {records.length === 0 ? (
            <p style={styles.muted}>No records yet.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left",
                fontSize: "13px",
              }}>
                <thead>
                  <tr style={{ color: "#83cfff" }}>
                    {["Record ID", "Faculty Name", "Date", "Time", "Status"].map((heading) => (
                      <th key={heading} style={{ padding: "12px 8px", borderBottom: "1px solid #304761" }}>
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {records.slice(0, 5).map((record) => (
                    <tr key={record.recordId}>
                      {[record.recordId, record.facultyName, record.date, record.time, record.status].map((value, index) => (
                        <td key={index} style={{ padding: "12px 8px", borderBottom: "1px solid #263a51" }}>
                          {value}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

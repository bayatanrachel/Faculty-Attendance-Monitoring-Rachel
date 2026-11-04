
"use client";

import { useEffect, useRef, useState } from "react";

const KEY = "faculty-attendance-records";

// Internal schedule validation only. Not displayed on the page.
const SCHEDULES = Array.from({ length: 17 }, (_, i) => {
  const hour = i + 7;
  return `${String(hour).padStart(2, "0")}:00`;
});

const styles = {
  page: {
    minHeight: "100vh",
    background: "#091321",
    color: "#edf4ff",
    padding: "28px 18px 40px",
    fontFamily: "Arial, Helvetica, sans-serif",
  },
  container: {
    width: "100%",
    maxWidth: "950px",
    margin: "0 auto",
  },
  link: {
    color: "#83cfff",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "600",
  },
  eyebrow: {
    color: "#70bfff",
    fontSize: "11px",
    fontWeight: "700",
    letterSpacing: "2px",
    textTransform: "uppercase",
    marginTop: "25px",
  },
  heading: {
    fontSize: "30px",
    lineHeight: 1.2,
    margin: "8px 0",
    color: "#f3f7fc",
  },
  muted: {
    color: "#9aacc0",
    lineHeight: 1.65,
    fontSize: "14px",
  },
  panel: {
    background: "linear-gradient(145deg, #172b43, #112137)",
    border: "1px solid #2b4059",
    borderRadius: "16px",
    padding: "22px",
    marginTop: "22px",
    boxShadow: "0 14px 34px rgba(0,0,0,.18)",
  },
  button: {
    background: "linear-gradient(100deg, #2678db, #3195df)",
    color: "#fff",
    border: "1px solid #4b9ce5",
    borderRadius: "10px",
    padding: "13px 20px",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
  },
  video: {
    display: "block",
    width: "100%",
    maxWidth: "430px",
    aspectRatio: "1 / 1",
    objectFit: "cover",
    borderRadius: "14px",
    background: "#050b13",
    border: "2px solid #398fe0",
    margin: "20px auto 0",
  },
  input: {
    display: "block",
    width: "100%",
    padding: "13px",
    borderRadius: "9px",
    border: "1px solid #405671",
    background: "#0b192a",
    color: "#fff",
    marginTop: "10px",
    fontSize: "14px",
    outline: "none",
    resize: "vertical",
  },
  sectionTitle: {
    fontSize: "20px",
    marginBottom: "8px",
    color: "#f1f6fc",
  },
};

function getRecords() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function parseQR(raw) {
  try {
    const data = JSON.parse(raw);

    if (
      !data.facultyName ||
      !data.facultyId ||
      !SCHEDULES.includes(data.classStart)
    ) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

export default function ScanPage() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const frameRef = useRef(null);
  const scanningRef = useRef(false);
  const busyRef = useRef(false);

  const [records, setRecords] = useState([]);
  const [cameraOn, setCameraOn] = useState(false);
  const [message, setMessage] = useState(
    "Select Start Camera to begin scanning."
  );
  const [error, setError] = useState("");
  const [manualQR, setManualQR] = useState("");
  const [lastRecord, setLastRecord] = useState(null);

  function loadRecords() {
    setRecords(getRecords());
  }

  function stopCamera() {
    scanningRef.current = false;

    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }

    setCameraOn(false);
  }

  function saveRecord(raw) {
    if (busyRef.current) return;

    const qr = parseQR(raw);

    if (!qr) {
      setError(
        "Invalid QR data. Required fields: facultyName, facultyId, and a valid classStart schedule."
      );
      return;
    }

    const now = new Date();
    const [hour, minute] = qr.classStart.split(":").map(Number);

    const classStart = new Date(now);
    classStart.setHours(hour, minute, 0, 0);

    const cutoff = new Date(
      classStart.getTime() + 15 * 60 * 1000
    );

    if (now < classStart) {
      setError("The scheduled class has not started yet.");
      return;
    }

    const date = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
    ].join("-");

    const saved = getRecords();

    const duplicate = saved.some(
      (record) =>
        record.facultyId === qr.facultyId &&
        record.date === date &&
        record.classStart === qr.classStart
    );

    if (duplicate) {
      setError(
        "An attendance record already exists for this schedule."
      );
      return;
    }

    busyRef.current = true;

    const record = {
      recordId: crypto.randomUUID().slice(0, 8),
      facultyName: String(qr.facultyName).trim(),
      facultyId: qr.facultyId,
      date,
      time: now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: now <= cutoff ? "Present" : "Late",
      classStart: qr.classStart,
    };

    const updated = [record, ...saved];

    try {
      localStorage.setItem(KEY, JSON.stringify(updated));
      setRecords(updated);
      setLastRecord(record);
      setMessage("Attendance successfully recorded!");
      setError("");
    } catch (saveError) {
      setError("Unable to save the attendance record.");
      console.error(saveError);
    } finally {
      busyRef.current = false;
    }

    stopCamera();
  }

  async function startCamera() {
    setError("");
    setMessage("Requesting camera permission...");

    if (!navigator.mediaDevices?.getUserMedia) {
      setError(
        "Camera access is unavailable. Use an updated browser over HTTPS."
      );
      return;
    }

    let stream;

    try {
      // Request camera access first.
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
        },
        audio: false,
      });

      streamRef.current = stream;

      // Check QR detection support after camera permission.
      if (!("BarcodeDetector" in window)) {
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;

        setMessage("Camera permission granted.");
        setError(
          "This browser does not support built-in QR detection. Update Google Chrome or use a supported browser."
        );
        return;
      }

      const detector = new window.BarcodeDetector({
        formats: ["qr_code"],
      });

      // Mount the video element before accessing its ref.
      setCameraOn(true);

      await new Promise((resolve) =>
        requestAnimationFrame(resolve)
      );

      const video = videoRef.current;

      if (!video) {
        throw new Error("Camera preview element is unavailable.");
      }

      video.srcObject = stream;
      await video.play();

      scanningRef.current = true;

      setMessage(
        "Camera is active. Align the faculty QR code within the frame."
      );

      async function scanFrame() {
        if (!scanningRef.current || !streamRef.current) {
          return;
        }

        try {
          const codes = await detector.detect(video);

          if (codes.length > 0 && codes[0].rawValue) {
            saveRecord(codes[0].rawValue);
          }
        } catch (scanError) {
          console.error("QR SCAN ERROR:", scanError);
        }

        if (scanningRef.current && streamRef.current) {
          frameRef.current = requestAnimationFrame(scanFrame);
        }
      }

      frameRef.current = requestAnimationFrame(scanFrame);
    } catch (cameraError) {
      console.error("CAMERA ERROR:", cameraError);

      stream?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setCameraOn(false);

      setError(
        cameraError.name === "NotAllowedError"
          ? "Camera permission was denied. Allow camera access in your browser site settings."
          : cameraError.name === "NotFoundError"
          ? "No camera was found on this device."
          : `Camera error: ${cameraError.message || cameraError.name}`
      );

      setMessage("Unable to start the camera.");
    }
  }

  useEffect(() => {
    loadRecords();

    const refresh = () => loadRecords();

    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);

    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);

      scanningRef.current = false;

      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }

      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <a href="/dashboard" style={styles.link}>
          ← Back to Dashboard
        </a>

        <header>
          <p style={styles.eyebrow}>
            Faculty Attendance System
          </p>

          <h1 style={styles.heading}>
            QR Code Scanner
          </h1>

          <p style={styles.muted}>
            Scan the faculty QR code to record classroom attendance.
          </p>
        </header>

        {/* CAMERA SCANNER */}
        <section style={styles.panel}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div>
              <h2 style={styles.sectionTitle}>
                Camera Scanner
              </h2>

              <p style={styles.muted}>
                Align the QR code inside the square.
              </p>
            </div>

            <span
              style={{
                padding: "7px 12px",
                borderRadius: "30px",
                fontSize: "12px",
                fontWeight: 700,
                color: cameraOn ? "#6ee7b7" : "#cbd5e1",
                background: cameraOn
                  ? "rgba(16,185,129,.12)"
                  : "rgba(148,163,184,.12)",
                border: cameraOn
                  ? "1px solid rgba(16,185,129,.3)"
                  : "1px solid #40516a",
              }}
            >
              ● Camera {cameraOn ? "Active" : "Inactive"}
            </span>
          </div>

          {/* Keep the video element mounted at all times. */}
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            style={{
              ...styles.video,
              display: cameraOn ? "block" : "none",
            }}
          />

          {!cameraOn && (
            <div
              style={{
                ...styles.video,
                display: "grid",
                placeItems: "center",
                background:
                  "linear-gradient(145deg, #0d2036, #071426)",
                color: "#9aacc0",
              }}
            >
              <div
                style={{
                  textAlign: "center",
                  padding: "20px",
                }}
              >
                <div
                  style={{
                    fontSize: "48px",
                    color: "#83cfff",
                  }}
                >
                  ▦
                </div>

                <p
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                  }}
                >
                  Camera Preview
                </p>
              </div>
            </div>
          )}

          <p
            style={{
              ...styles.muted,
              textAlign: "center",
              marginTop: "14px",
            }}
          >
            Keep the faculty QR code within the scanning area.
          </p>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: "20px",
            }}
          >
            {!cameraOn ? (
              <button
                onClick={startCamera}
                style={styles.button}
              >
                Start Camera
              </button>
            ) : (
              <button
                onClick={stopCamera}
                style={{
                  ...styles.button,
                  background: "#a43d4a",
                  borderColor: "#c45a66",
                }}
              >
                Stop Camera
              </button>
            )}
          </div>

          <div
            style={{
              marginTop: "18px",
              padding: "14px",
              borderRadius: "10px",
              background: "#0b192a",
              border: "1px solid #304761",
              textAlign: "center",
            }}
          >
            <p
              style={{
                color: "#c8d7e8",
                fontSize: "14px",
              }}
            >
              {message}
            </p>

            {error && (
              <p
                style={{
                  color: "#ff929c",
                  fontSize: "13px",
                  marginTop: "9px",
                }}
              >
                {error}
              </p>
            )}
          </div>
        </section>

        {/* ATTENDANCE CONFIRMATION */}
        {lastRecord && (
          <section
            style={{
              ...styles.panel,
              borderColor: "#277b63",
            }}
          >
            <h2
              style={{
                ...styles.sectionTitle,
                color: "#6ee7b7",
              }}
            >
              Attendance Saved!
            </h2>

            <p
              style={{
                marginTop: "12px",
                fontSize: "17px",
                fontWeight: 700,
              }}
            >
              {lastRecord.facultyName}
            </p>

            <div
              style={{
                ...styles.muted,
                marginTop: "8px",
                fontSize: "13px",
              }}
            >
              <p>Date: {lastRecord.date}</p>
              <p>Class: {lastRecord.classStart}</p>
              <p>Scan Time: {lastRecord.time}</p>
              <p>Status: {lastRecord.status}</p>
            </div>

            <a
              href="/history"
              style={{
                ...styles.link,
                display: "inline-block",
                marginTop: "14px",
              }}
            >
              View Attendance History →
            </a>
          </section>
        )}

        {/* MANUAL QR TEST */}
        <section style={styles.panel}>
          <h2 style={styles.sectionTitle}>
            Manual QR Test
          </h2>

          <p style={styles.muted}>
            Enter QR data manually for testing.
          </p>

          <textarea
            value={manualQR}
            onChange={(e) => setManualQR(e.target.value)}
            rows={3}
            placeholder='{"facultyName":"Sherilyn Tobias","facultyId":"FAC-001","classStart":"07:00"}'
            style={styles.input}
          />

          <button
            onClick={() => saveRecord(manualQR)}
            style={{
              ...styles.button,
              marginTop: "14px",
            }}
          >
            Save Test Scan
          </button>
        </section>

        {/* LATEST ATTENDANCE */}
        <section style={styles.panel}>
          <h2 style={styles.sectionTitle}>
            Latest Attendance
          </h2>

          <p style={styles.muted}>
            Recently recorded faculty attendance.
          </p>

          {records.length === 0 ? (
            <div
              style={{
                marginTop: "18px",
                padding: "34px 14px",
                textAlign: "center",
                border: "1px dashed #40516a",
                borderRadius: "11px",
                background: "#0b192a",
              }}
            >
              <p style={styles.muted}>
                No attendance records yet.
              </p>
            </div>
          ) : (
            <div
              style={{
                overflowX: "auto",
                marginTop: "18px",
                border: "1px solid #304761",
                borderRadius: "10px",
              }}
            >
              <table
                style={{
                  width: "100%",
                  minWidth: "570px",
                  borderCollapse: "collapse",
                  textAlign: "left",
                  fontSize: "13px",
                }}
              >
                <thead
                  style={{
                    background: "#0b192a",
                    color: "#83cfff",
                  }}
                >
                  <tr>
                    {[
                      "Record ID",
                      "Faculty Name",
                      "Date",
                      "Time",
                      "Status",
                    ].map((heading) => (
                      <th
                        key={heading}
                        style={{
                          padding: "13px 10px",
                        }}
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {records.slice(0, 5).map((record) => (
                    <tr
                      key={record.recordId}
                      style={{
                        borderTop: "1px solid #263a51",
                      }}
                    >
                      {[
                        record.recordId,
                        record.facultyName,
                        record.date,
                        record.time,
                      ].map((value, index) => (
                        <td
                          key={index}
                          style={{
                            padding: "13px 10px",
                            color: "#cbd5e1",
                          }}
                        >
                          {value}
                        </td>
                      ))}

                      <td
                        style={{
                          padding: "13px 10px",
                        }}
                      >
                        <span
                          style={{
                            display: "inline-block",
                            borderRadius: "20px",
                            padding: "5px 10px",
                            fontSize: "11px",
                            fontWeight: 700,
                            color:
                              record.status === "Present"
                                ? "#6ee7b7"
                                : "#fbbf24",
                            background:
                              record.status === "Present"
                                ? "rgba(16,185,129,.12)"
                                : "rgba(245,158,11,.12)",
                          }}
                        >
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <p
          style={{
            ...styles.muted,
            textAlign: "center",
            fontSize: "12px",
            marginTop: "22px",
          }}
        >
          Present: class start through 15 minutes after. Late: from
          the 16th minute onward. One record per faculty, date, and
          class schedule.
        </p>
      </div>
    </main>
  );
}

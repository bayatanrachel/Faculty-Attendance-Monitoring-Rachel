
"use client";

import { useEffect, useRef, useState } from "react";

const KEY = "faculty-attendance-records";
const FACULTY_NAME = "Sherilyn Tobias";
const FACULTY_ID = "FAC-001";
const PERMANENT_QR_URL =
  "https://faculty-attendance-monitoring-rache-xi.vercel.app";

const SCHEDULES = [
  "08:00",
  "09:00",
  "10:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
];

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
    const scannedURL = new URL(raw.trim());

    const scannedAddress =
      scannedURL.origin + scannedURL.pathname.replace(/\/+$/, "");

    if (scannedAddress !== PERMANENT_QR_URL) {
      return null;
    }

    return {
      facultyName: FACULTY_NAME,
      facultyId: FACULTY_ID,
    };
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
    "Your scanner is ready. Start the camera to begin."
  );
  const [error, setError] = useState("");
  const [manualQR, setManualQR] = useState(PERMANENT_QR_URL);
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
        "Invalid faculty QR code. Please scan the official faculty QR code."
      );
      return;
    }

    const now = new Date();
    const hour = now.getHours();

    if (hour < 7 || hour > 23) {
      setError("There is no scheduled class at this time.");
      return;
    }

    const classStart = `${String(hour).padStart(2, "0")}:00`;

    if (!SCHEDULES.includes(classStart)) {
      setError("No valid class schedule was found.");
      return;
    }

    const scheduledStart = new Date(now);
    scheduledStart.setMinutes(0, 0, 0);

    const cutoff = new Date(
      scheduledStart.getTime() + 15 * 60 * 1000
    );

    const date = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
    ].join("-");

    const saved = getRecords();

    const duplicate = saved.some(
      (record) =>
        record.date === date &&
        record.classStart === classStart &&
        (record.facultyId === qr.facultyId ||
          (!record.facultyId &&
            record.facultyName === qr.facultyName))
    );

    if (duplicate) {
      setError(
        "Attendance has already been recorded for this schedule."
      );
      return;
    }

    busyRef.current = true;

    const record = {
      recordId:
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID().slice(0, 8)
          : `${Date.now()}`,
      facultyName: qr.facultyName,
      facultyId: qr.facultyId,
      date,
      time: now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: now <= cutoff ? "Present" : "Late",
      classStart,
    };

    const updated = [record, ...saved];

    try {
      localStorage.setItem(KEY, JSON.stringify(updated));
      setRecords(updated);
      setLastRecord(record);
      setMessage("Attendance successfully recorded!");
      setError("");
      stopCamera();
    } catch (saveError) {
      setError("Unable to save the attendance record.");
      console.error(saveError);
    } finally {
      busyRef.current = false;
    }
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
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (!("BarcodeDetector" in window)) {
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;

        setMessage("Camera permission granted.");
        setError(
          "This browser does not support built-in QR detection. Use a supported browser."
        );
        return;
      }

      const detector = new window.BarcodeDetector({
        formats: ["qr_code"],
      });

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
      scanningRef.current = false;

      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }

      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const statusColor =
    error
      ? "error"
      : lastRecord && message === "Attendance successfully recorded!"
      ? "success"
      : cameraOn
      ? "active"
      : "idle";

  return (
    <main className="scanner-page">
      <div className="scanner-container">
        <a href="/dashboard" className="back-link">
          <span>←</span> Back to Dashboard
        </a>

        <header className="page-header">
          <div className="header-icon">⌗</div>

          <div className="header-copy">
            <div className="eyebrow">
              FACULTY ATTENDANCE SYSTEM
            </div>

            <h1>QR Code Scanner</h1>

            <p>
              Scan the official faculty QR code to record classroom
              attendance.
            </p>
          </div>

          <div className="header-tag">
            <span className="tag-dot" />
            Faculty Scanner
          </div>
        </header>

        <section className="scanner-layout">
          <div className="scanner-main">
            <div className="section-heading">
              <div>
                <div className="section-kicker">SCANNING STATION</div>
                <h2>Camera Scanner</h2>
                <p>Position the QR code inside the scanning frame.</p>
              </div>

              <div className={`camera-status ${cameraOn ? "is-active" : ""}`}>
                <span className="status-dot" />
                {cameraOn ? "Camera Active" : "Camera Offline"}
              </div>
            </div>

            <div className={`camera-stage ${cameraOn ? "camera-running" : ""}`}>
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="camera-video"
              />

              {!cameraOn && (
                <div className="camera-placeholder">
                  <div className="placeholder-icon">⌗</div>
                  <h3>Camera Preview</h3>
                  <p>Your camera preview will appear here.</p>
                </div>
              )}

              <div className="scan-overlay">
                <div className="scan-frame">
                  <span className="corner top-left" />
                  <span className="corner top-right" />
                  <span className="corner bottom-left" />
                  <span className="corner bottom-right" />
                  {cameraOn && <div className="scan-line" />}
                </div>
              </div>

              <div className="camera-label">
                <span className="camera-label-dot" />
                {cameraOn ? "LIVE CAMERA FEED" : "SCANNER STANDBY"}
              </div>
            </div>

            <div className="camera-instruction">
              <span className="instruction-icon">ⓘ</span>
              <span>
                Keep the official faculty QR code steady and within the
                square frame.
              </span>
            </div>

            <div className="camera-actions">
              {!cameraOn ? (
                <button
                  type="button"
                  onClick={startCamera}
                  className="primary-button"
                >
                  <span>▣</span> Start Camera
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopCamera}
                  className="stop-button"
                >
                  <span>■</span> Stop Camera
                </button>
              )}
            </div>

            <div className={`scanner-feedback ${statusColor}`}>
              <div className="feedback-icon">
                {error ? "!" : statusColor === "success" ? "✓" : cameraOn ? "◉" : "i"}
              </div>

              <div className="feedback-content">
                <strong>
                  {error
                    ? "Scanner Notice"
                    : statusColor === "success"
                    ? "Attendance Recorded"
                    : cameraOn
                    ? "Scanner is Running"
                    : "Ready to Scan"}
                </strong>
                <p>{error || message}</p>
              </div>
            </div>
          </div>

          <aside className="scanner-sidebar">
            <div className="side-card faculty-card">
              <div className="side-card-label">REGISTERED FACULTY</div>

              <div className="faculty-avatar">ST</div>

              <h3>{FACULTY_NAME}</h3>
              <p>Faculty Member</p>

              <div className="faculty-id">
                <span>FACULTY ID</span>
                <strong>{FACULTY_ID}</strong>
              </div>
            </div>

            <div className="side-card guide-card">
              <div className="side-card-label">SCANNING GUIDE</div>

              <div className="guide-step">
                <span className="step-number">01</span>
                <div>
                  <strong>Start the camera</strong>
                  <p>Allow camera access when prompted.</p>
                </div>
              </div>

              <div className="guide-divider" />

              <div className="guide-step">
                <span className="step-number">02</span>
                <div>
                  <strong>Align the QR code</strong>
                  <p>Place the official code inside the frame.</p>
                </div>
              </div>

              <div className="guide-divider" />

              <div className="guide-step">
                <span className="step-number">03</span>
                <div>
                  <strong>Wait for confirmation</strong>
                  <p>The attendance result will appear automatically.</p>
                </div>
              </div>
            </div>
          </aside>
        </section>

        {lastRecord && (
          <section className="saved-panel">
            <div className="saved-heading">
              <div className="saved-check">✓</div>
              <div>
                <div className="saved-kicker">SUCCESSFUL SCAN</div>
                <h2>Attendance Saved</h2>
              </div>
              <span className={`attendance-badge ${lastRecord.status.toLowerCase()}`}>
                {lastRecord.status}
              </span>
            </div>

            <div className="saved-details">
              <div>
                <span>Faculty Name</span>
                <strong>{lastRecord.facultyName}</strong>
              </div>
              <div>
                <span>Date</span>
                <strong>{lastRecord.date}</strong>
              </div>
              <div>
                <span>Class Schedule</span>
                <strong>{lastRecord.classStart}</strong>
              </div>
              <div>
                <span>Scan Time</span>
                <strong>{lastRecord.time}</strong>
              </div>
            </div>

            <a href="/history" className="history-link">
              View Attendance History →
            </a>
          </section>
        )}

        <section className="manual-section">
          <div className="section-heading manual-heading">
            <div>
              <div className="section-kicker">TESTING TOOL</div>
              <h2>Manual QR Test</h2>
              <p>Test attendance recording using the permanent faculty QR URL.</p>
            </div>
            <div className="tool-icon">⌨</div>
          </div>

          <label htmlFor="manual-qr" className="field-label">
            Faculty QR Code URL
          </label>

          <textarea
            id="manual-qr"
            value={manualQR}
            onChange={(e) => setManualQR(e.target.value)}
            rows={3}
            placeholder={PERMANENT_QR_URL}
            className="manual-input"
          />

          <button
            type="button"
            onClick={() => saveRecord(manualQR)}
            className="secondary-button"
          >
            <span>＋</span> Save Test Scan
          </button>
        </section>

        <section className="records-section">
          <div className="section-heading records-heading">
            <div>
              <div className="section-kicker">RECENT ACTIVITY</div>
              <h2>Latest Attendance</h2>
              <p>Recently recorded faculty attendance.</p>
            </div>

            <div className="record-count">
              <strong>{records.length}</strong>
              <span>Total Records</span>
            </div>
          </div>

          {records.length === 0 ? (
            <div className="empty-records">
              <div className="empty-icon">▤</div>
              <h3>No Attendance Records</h3>
              <p>Recorded faculty attendance will appear here.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="attendance-table">
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
                  {records.slice(0, 5).map((record, index) => (
                    <tr key={record.recordId || `${record.date}-${index}`}>
                      <td className="record-id">{record.recordId}</td>
                      <td className="faculty-name-cell">{record.facultyName}</td>
                      <td>{record.date}</td>
                      <td>{record.time}</td>
                      <td>
                        <span
                          className={`attendance-badge ${
                            (record.status || "").toLowerCase()
                          }`}
                        >
                          <span className="badge-dot" />
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <a href="/history" className="all-records-link">
            View All Attendance Records →
          </a>
        </section>

        <footer className="scanner-footer">
          <div className="footer-line" />
          <p>FACULTY ATTENDANCE MONITORING SYSTEM</p>
          <span>
            Present: within 15 minutes after class starts. Late: from the
            16th minute onward.
          </span>
        </footer>
      </div>

      <style jsx>{`
        .scanner-page {
          min-height: 100vh;
          padding: 30px 24px 48px;
          color: #edf4ff;
          background:
            radial-gradient(ellipse at 12% 0%, rgba(32, 105, 184, .16), transparent 35%),
            radial-gradient(ellipse at 100% 45%, rgba(30, 80, 140, .10), transparent 34%),
            #091321;
          font-family: Arial, Helvetica, sans-serif;
        }

        .scanner-container {
          max-width: 1160px;
          margin: 0 auto;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          color: #91cfff;
          text-decoration: none;
          font-size: 13px;
          font-weight: 700;
          transition: color .2s ease;
        }

        .back-link:hover,
        .history-link:hover,
        .all-records-link:hover {
          color: #c6e7ff;
        }

        .page-header {
          display: flex;
          align-items: center;
          gap: 18px;
          margin: 32px 0 30px;
        }

        .header-icon {
          width: 64px;
          height: 64px;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          border: 1px solid rgba(84, 166, 255, .35);
          border-radius: 18px;
          color: #8acbff;
          background: linear-gradient(145deg, #183a60, #102640);
          font-size: 36px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, .22);
        }

        .header-copy {
          flex: 1;
        }

        .eyebrow,
        .section-kicker,
        .side-card-label,
        .saved-kicker {
          color: #73baff;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.8px;
        }

        .page-header h1 {
          margin: 6px 0;
          color: #f4f8ff;
          font-size: clamp(27px, 4vw, 36px);
          letter-spacing: -.8px;
        }

        .page-header p {
          margin: 0;
          color: #9aacc0;
          font-size: 14px;
          line-height: 1.6;
        }

        .header-tag {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 13px;
          border: 1px solid #29445f;
          border-radius: 30px;
          color: #bdd9f2;
          background: rgba(17, 38, 61, .75);
          font-size: 11px;
          font-weight: 700;
          white-space: nowrap;
        }

        .tag-dot,
        .status-dot,
        .camera-label-dot,
        .badge-dot {
          width: 7px;
          height: 7px;
          display: inline-block;
          border-radius: 50%;
          background: #58b9ff;
        }

        .scanner-layout {
          display: grid;
          grid-template-columns: minmax(0, 1.7fr) minmax(250px, .85fr);
          gap: 20px;
          align-items: start;
        }

        .scanner-main,
        .manual-section,
        .records-section,
        .saved-panel {
          border: 1px solid #263f5b;
          border-radius: 19px;
          background: linear-gradient(145deg, rgba(22, 43, 67, .98), rgba(13, 30, 49, .98));
          box-shadow: 0 18px 45px rgba(0, 0, 0, .16);
        }

        .scanner-main {
          padding: 24px;
        }

        .section-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
        }

        .section-heading h2,
        .saved-heading h2 {
          margin: 6px 0;
          color: #f2f7ff;
          font-size: 21px;
          letter-spacing: -.3px;
        }

        .section-heading p {
          margin: 0;
          color: #93a8bd;
          font-size: 13px;
          line-height: 1.6;
        }

        .camera-status {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
          padding: 8px 11px;
          border: 1px solid #40516a;
          border-radius: 30px;
          color: #b5c4d4;
          background: rgba(8, 20, 34, .6);
          font-size: 11px;
          font-weight: 700;
        }

        .camera-status.is-active {
          border-color: rgba(43, 190, 145, .4);
          color: #76e2bb;
          background: rgba(16, 120, 89, .12);
        }

        .camera-status.is-active .status-dot {
          background: #4fe0ac;
          box-shadow: 0 0 10px rgba(79, 224, 172, .7);
        }

        .camera-stage {
          position: relative;
          display: grid;
          place-items: center;
          width: 100%;
          min-height: 330px;
          margin-top: 23px;
          overflow: hidden;
          border: 1px solid #294b6e;
          border-radius: 15px;
          background:
            radial-gradient(circle at center, rgba(28, 76, 120, .32), transparent 55%),
            #071321;
        }

        .camera-video {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          background: #050b13;
        }

        .camera-placeholder {
          position: relative;
          z-index: 1;
          padding: 35px 15px;
          text-align: center;
        }

        .placeholder-icon {
          display: grid;
          place-items: center;
          width: 76px;
          height: 76px;
          margin: 0 auto 17px;
          border: 1px solid #315b80;
          border-radius: 22px;
          color: #8bcaff;
          background: rgba(24, 66, 105, .35);
          font-size: 43px;
        }

        .camera-placeholder h3 {
          margin: 0 0 8px;
          color: #dcecff;
          font-size: 16px;
        }

        .camera-placeholder p {
          margin: 0;
          color: #8198af;
          font-size: 12px;
        }

        .scan-overlay {
          position: absolute;
          inset: 0;
          z-index: 2;
          display: grid;
          place-items: center;
          pointer-events: none;
        }

        .scan-frame {
          position: relative;
          width: min(54%, 220px);
          aspect-ratio: 1;
          border-radius: 12px;
          background: rgba(12, 35, 57, .04);
        }

        .corner {
          position: absolute;
          width: 34px;
          height: 34px;
          border-color: #67c4ff;
          border-style: solid;
          filter: drop-shadow(0 0 5px rgba(77, 180, 255, .55));
        }

        .top-left {
          top: 0;
          left: 0;
          border-width: 3px 0 0 3px;
          border-radius: 9px 0 0;
        }

        .top-right {
          top: 0;
          right: 0;
          border-width: 3px 3px 0 0;
          border-radius: 0 9px 0 0;
        }

        .bottom-left {
          bottom: 0;
          left: 0;
          border-width: 0 0 3px 3px;
          border-radius: 0 0 0 9px;
        }

        .bottom-right {
          right: 0;
          bottom: 0;
          border-width: 0 3px 3px 0;
          border-radius: 0 0 9px;
        }

        .scan-line {
          position: absolute;
          top: 10%;
          left: 5%;
          width: 90%;
          height: 2px;
          border-radius: 10px;
          background: #65d5ff;
          box-shadow: 0 0 13px 3px rgba(60, 190, 255, .6);
          animation: scanMove 2.4s ease-in-out infinite alternate;
        }

        @keyframes scanMove {
          from { top: 10%; }
          to { top: 90%; }
        }

        .camera-label {
          position: absolute;
          z-index: 3;
          top: 13px;
          left: 14px;
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 7px 10px;
          border: 1px solid rgba(112, 157, 197, .25);
          border-radius: 6px;
          color: #c5d9ed;
          background: rgba(5, 16, 28, .7);
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1px;
        }

        .camera-label-dot {
          width: 6px;
          height: 6px;
        }

        .camera-running .camera-label-dot {
          background: #51e0ac;
          box-shadow: 0 0 8px #51e0ac;
        }

        .camera-instruction {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          margin-top: 15px;
          color: #9bb0c6;
          font-size: 12px;
          line-height: 1.6;
        }

        .instruction-icon {
          color: #76bfff;
          font-size: 16px;
          font-weight: 700;
        }

        .camera-actions {
          display: flex;
          justify-content: center;
          margin-top: 21px;
        }

        .primary-button,
        .stop-button,
        .secondary-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          min-height: 47px;
          padding: 0 25px;
          border: 1px solid #459de8;
          border-radius: 10px;
          color: white;
          background: linear-gradient(110deg, #2477d2, #299ce3);
          box-shadow: 0 8px 20px rgba(24, 112, 202, .2);
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          transition: transform .2s ease, filter .2s ease;
        }

        .primary-button:hover,
        .stop-button:hover,
        .secondary-button:hover {
          transform: translateY(-2px);
          filter: brightness(1.1);
        }

        .stop-button {
          border-color: #bd5965;
          background: linear-gradient(110deg, #9f3948, #c64d5a);
          box-shadow: 0 8px 20px rgba(180, 54, 70, .16);
        }

        .scanner-feedback {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-top: 20px;
          padding: 15px;
          border: 1px solid #314b65;
          border-radius: 11px;
          background: rgba(6, 19, 33, .72);
        }

        .feedback-icon {
          display: grid;
          place-items: center;
          width: 28px;
          height: 28px;
          flex-shrink: 0;
          border-radius: 50%;
          color: #a9d8ff;
          background: rgba(50, 139, 213, .18);
          font-weight: 800;
        }

        .feedback-content strong {
          display: block;
          margin: 2px 0 5px;
          color: #dceeff;
          font-size: 12px;
        }

        .feedback-content p {
          margin: 0;
          color: #9eb2c8;
          font-size: 12px;
          line-height: 1.6;
          overflow-wrap: anywhere;
        }

        .scanner-feedback.success {
          border-color: rgba(49, 184, 137, .4);
          background: rgba(11, 91, 69, .15);
        }

        .scanner-feedback.success .feedback-icon {
          color: #7aebc0;
          background: rgba(32, 179, 130, .18);
        }

        .scanner-feedback.error {
          border-color: rgba(224, 91, 105, .4);
          background: rgba(125, 34, 48, .15);
        }

        .scanner-feedback.error .feedback-icon {
          color: #ff9ba4;
          background: rgba(216, 67, 83, .18);
        }

        .scanner-sidebar {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .side-card {
          padding: 20px;
          border: 1px solid #263f5b;
          border-radius: 17px;
          background: linear-gradient(145deg, #152b44, #102238);
          box-shadow: 0 14px 35px rgba(0, 0, 0, .14);
        }

        .faculty-card {
          text-align: center;
        }

        .faculty-card .side-card-label {
          text-align: left;
        }

        .faculty-avatar {
          display: grid;
          place-items: center;
          width: 65px;
          height: 65px;
          margin: 20px auto 12px;
          border: 1px solid #4a8dc6;
          border-radius: 20px;
          color: #d8edff;
          background: linear-gradient(145deg, #285b8b, #183c60);
          font-size: 22px;
          font-weight: 800;
          box-shadow: 0 8px 22px rgba(18, 96, 157, .2);
        }

        .faculty-card h3 {
          margin: 0;
          color: #f0f6ff;
          font-size: 17px;
        }

        .faculty-card > p {
          margin: 6px 0 18px;
          color: #8ea6bf;
          font-size: 12px;
        }

        .faculty-id {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 12px;
          border: 1px solid #2c4966;
          border-radius: 9px;
          background: rgba(6, 19, 33, .5);
        }

        .faculty-id span {
          color: #8ca6c0;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1px;
        }

        .faculty-id strong {
          color: #9bd2ff;
          font-size: 12px;
        }

        .guide-card .side-card-label {
          margin-bottom: 20px;
        }

        .guide-step {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .step-number {
          display: grid;
          place-items: center;
          width: 31px;
          height: 31px;
          flex-shrink: 0;
          border: 1px solid #365d82;
          border-radius: 9px;
          color: #8bcaff;
          background: rgba(42, 111, 170, .18);
          font-size: 10px;
          font-weight: 800;
        }

        .guide-step strong {
          display: block;
          margin: 2px 0 5px;
          color: #e0edfb;
          font-size: 12px;
        }

        .guide-step p {
          margin: 0;
          color: #91a7bd;
          font-size: 11px;
          line-height: 1.6;
        }

        .guide-divider {
          width: 1px;
          height: 17px;
          margin: 7px 0 7px 15px;
          background: #34516d;
        }

        .saved-panel {
          margin-top: 20px;
          padding: 22px;
          border-color: rgba(54, 177, 133, .4);
          background: linear-gradient(145deg, rgba(15, 62, 55, .55), rgba(13, 37, 47, .98));
        }

        .saved-heading {
          display: flex;
          align-items: center;
          gap: 13px;
        }

        .saved-check {
          display: grid;
          place-items: center;
          width: 40px;
          height: 40px;
          border-radius: 13px;
          color: #83edc4;
          background: rgba(38, 184, 132, .17);
          font-size: 21px;
          font-weight: 800;
        }

        .saved-kicker {
          color: #70dcb5;
        }

        .saved-heading h2 {
          margin: 4px 0 0;
          font-size: 19px;
        }

        .attendance-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 6px 10px;
          border-radius: 30px;
          color: #78e4ba;
          background: rgba(16, 185, 129, .13);
          font-size: 10px;
          font-weight: 800;
          white-space: nowrap;
        }

        .saved-heading .attendance-badge {
          margin-left: auto;
        }

        .attendance-badge.late {
          color: #ffd17c;
          background: rgba(245, 158, 11, .13);
        }

        .attendance-badge.absent {
          color: #ff9da7;
          background: rgba(239, 68, 68, .13);
        }

        .saved-details {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          margin-top: 20px;
        }

        .saved-details > div {
          padding: 13px;
          border: 1px solid rgba(93, 158, 143, .25);
          border-radius: 9px;
          background: rgba(5, 23, 30, .35);
        }

        .saved-details span,
        .saved-details strong {
          display: block;
        }

        .saved-details span {
          margin-bottom: 7px;
          color: #91b8ae;
          font-size: 10px;
        }

        .saved-details strong {
          color: #e1f7ef;
          font-size: 12px;
          overflow-wrap: anywhere;
        }

        .history-link,
        .all-records-link {
          display: inline-block;
          margin-top: 17px;
          color: #8dcaff;
          text-decoration: none;
          font-size: 12px;
          font-weight: 800;
        }

        .manual-section,
        .records-section {
          margin-top: 20px;
          padding: 23px;
        }

        .manual-heading {
          margin-bottom: 22px;
        }

        .tool-icon {
          display: grid;
          place-items: center;
          width: 43px;
          height: 43px;
          border: 1px solid #355d81;
          border-radius: 12px;
          color: #9bd4ff;
          background: rgba(40, 111, 169, .16);
          font-size: 21px;
        }

        .field-label {
          display: block;
          margin-bottom: 9px;
          color: #c3d5e8;
          font-size: 12px;
          font-weight: 700;
        }

        .manual-input {
          display: block;
          width: 100%;
          box-sizing: border-box;
          padding: 14px;
          border: 1px solid #36536f;
          border-radius: 10px;
          outline: none;
          color: #e5f2ff;
          background: #091a2c;
          font-family: inherit;
          font-size: 13px;
          line-height: 1.6;
          resize: vertical;
          transition: border-color .2s ease, box-shadow .2s ease;
        }

        .manual-input:focus {
          border-color: #4b9ee0;
          box-shadow: 0 0 0 3px rgba(61, 148, 218, .12);
        }

        .secondary-button {
          min-height: 43px;
          margin-top: 13px;
          padding: 0 19px;
          font-size: 12px;
        }

        .records-heading {
          margin-bottom: 20px;
        }

        .record-count {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-width: 83px;
          padding: 10px 13px;
          border: 1px solid #34536f;
          border-radius: 11px;
          background: rgba(7, 23, 39, .55);
        }

        .record-count strong {
          color: #8dcbff;
          font-size: 22px;
        }

        .record-count span {
          margin-top: 3px;
          color: #91a9c0;
          font-size: 9px;
        }

        .empty-records {
          padding: 38px 15px;
          border: 1px dashed #3a5874;
          border-radius: 12px;
          background: rgba(7, 21, 36, .42);
          text-align: center;
        }

        .empty-icon {
          margin-bottom: 12px;
          color: #6daee4;
          font-size: 33px;
        }

        .empty-records h3 {
          margin: 0 0 7px;
          color: #dcecff;
          font-size: 14px;
        }

        .empty-records p {
          margin: 0;
          color: #91a8bf;
          font-size: 12px;
        }

        .table-wrap {
          overflow-x: auto;
          border: 1px solid #2b4661;
          border-radius: 11px;
        }

        .attendance-table {
          width: 100%;
          min-width: 610px;
          border-collapse: collapse;
          text-align: left;
          font-size: 12px;
        }

        .attendance-table thead {
          color: #a9d7ff;
          background: #0b1d30;
        }

        .attendance-table th {
          padding: 14px 13px;
          font-size: 10px;
          letter-spacing: .4px;
          font-weight: 800;
        }

        .attendance-table td {
          padding: 14px 13px;
          border-top: 1px solid #263e57;
          color: #bdcddd;
          white-space: nowrap;
        }

        .attendance-table tbody tr {
          transition: background .2s ease;
        }

        .attendance-table tbody tr:hover {
          background: rgba(57, 117, 168, .09);
        }

        .record-id {
          color: #8dcaff !important;
          font-weight: 700;
        }

        .faculty-name-cell {
          color: #edf5ff !important;
          font-weight: 700;
        }

        .attendance-table .attendance-badge {
          padding: 6px 9px;
        }

        .all-records-link {
          margin-top: 18px;
        }

        .scanner-footer {
          padding-top: 28px;
          text-align: center;
        }

        .footer-line {
          width: 100%;
          height: 1px;
          margin-bottom: 20px;
          background: linear-gradient(90deg, transparent, #34516c, transparent);
        }

        .scanner-footer p {
          margin: 0 0 7px;
          color: #7793ad;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1.7px;
        }

        .scanner-footer span {
          color: #637d96;
          font-size: 10px;
          line-height: 1.6;
        }

        @media (max-width: 850px) {
          .scanner-layout {
            grid-template-columns: 1fr;
          }

          .scanner-sidebar {
            display: grid;
            grid-template-columns: 1fr 1fr;
          }

          .saved-details {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 600px) {
          .scanner-page {
            padding: 21px 13px 35px;
          }

          .page-header {
            align-items: flex-start;
            gap: 12px;
            margin: 27px 0 23px;
          }

          .header-icon {
            width: 49px;
            height: 49px;
            border-radius: 14px;
            font-size: 29px;
          }

          .page-header h1 {
            font-size: 26px;
          }

          .page-header p {
            font-size: 12px;
          }

          .header-tag {
            display: none;
          }

          .scanner-main,
          .manual-section,
          .records-section {
            padding: 17px;
            border-radius: 15px;
          }

          .section-heading {
            align-items: flex-start;
          }

          .section-heading h2 {
            font-size: 19px;
          }

          .section-heading p {
            font-size: 11px;
          }

          .camera-status {
            padding: 7px 8px;
            font-size: 9px;
          }

          .camera-stage {
            min-height: 285px;
          }

          .scan-frame {
            width: 59%;
          }

          .scanner-sidebar {
            grid-template-columns: 1fr;
          }

          .saved-panel {
            padding: 17px;
          }

          .saved-details {
            gap: 8px;
          }

          .saved-details > div {
            padding: 10px;
          }

          .saved-details strong {
            font-size: 11px;
          }

          .saved-heading h2 {
            font-size: 17px;
          }

          .record-count {
            min-width: 68px;
            padding: 8px;
          }

          .record-count strong {
            font-size: 19px;
          }

          .attendance-table th,
          .attendance-table td {
            padding: 12px 10px;
          }
        }

        @media (max-width: 380px) {
          .camera-status {
            font-size: 8px;
          }

          .saved-heading {
            flex-wrap: wrap;
          }

          .saved-heading .attendance-badge {
            margin-left: 0;
          }

          .saved-details {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .scan-line {
            animation: none;
          }

          .primary-button,
          .stop-button,
          .secondary-button {
            transition: none;
          }
        }
      `}</style>
    </main>
  );
}

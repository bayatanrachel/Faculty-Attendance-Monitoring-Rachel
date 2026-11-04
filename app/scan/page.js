
"use client";

import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "faculty-attendance-records";

const SCHEDULES = Array.from({ length: 17 }, (_, i) =>
  `${String(i + 7).padStart(2, "0")}:00`
);

function getRecords() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
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
  const scanningRef = useRef(false);
  const frameRef = useRef(null);
  const busyRef = useRef(false);

  const [records, setRecords] = useState([]);
  const [cameraOn, setCameraOn] = useState(false);
  const [message, setMessage] = useState(
    "Pindutin ang Start Camera para mag-scan."
  );
  const [error, setError] = useState("");
  const [manualQR, setManualQR] = useState("");
  const [lastRecord, setLastRecord] = useState(null);

  function loadRecords() {
    setRecords(getRecords());
  }

  function stopCamera() {
    scanningRef.current = false;
    busyRef.current = false;

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

  function saveAttendance(raw) {
    if (busyRef.current) return;

    const qr = parseQR(raw);

    if (!qr) {
      setError(
        "Invalid QR. Kailangan ang facultyName, facultyId, at valid classStart schedule."
      );
      return;
    }

    const now = new Date();
    const [hour, minute] = qr.classStart.split(":").map(Number);

    const classStart = new Date(now);
    classStart.setHours(hour, minute, 0, 0);

    const cutoff = new Date(classStart.getTime() + 15 * 60 * 1000);

    if (now < classStart) {
      setError("Hindi pa nagsisimula ang scheduled class.");
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
      setError("May existing attendance record na para sa schedule na ito.");
      return;
    }

    busyRef.current = true;

    const record = {
      recordId: crypto.randomUUID().slice(0, 8),
      facultyName: qr.facultyName,
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setRecords(updated);
      setLastRecord(record);
      setMessage("Attendance successfully recorded!");
      setError("");
    } catch (saveError) {
      setError("Hindi ma-save ang attendance record.");
      console.error(saveError);
    }

    busyRef.current = false;
    stopCamera();
  }

  async function startCamera() {
    setError("");
    setMessage("Opening camera...");

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera access is unavailable. Use an updated browser over HTTPS.");
      return;
    }

    if (!("BarcodeDetector" in window)) {
      setError("QR scanning is not supported by this browser. Try an updated Chrome.");
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

      const video = videoRef.current;

      if (!video) {
        stream.getTracks().forEach((track) => track.stop());
        throw new Error("Video element not found.");
      }

      streamRef.current = stream;
      scanningRef.current = true;

      video.srcObject = stream;
      await video.play();

      setCameraOn(true);
      setMessage("Camera active. Point it at the faculty QR code.");

      async function scanFrame() {
        if (!scanningRef.current || !streamRef.current) return;

        try {
          const codes = await detector.detect(video);

          if (codes.length > 0 && codes[0].rawValue) {
            saveAttendance(codes[0].rawValue);
          }
        } catch (scanError) {
          console.error("SCAN ERROR:", scanError);
        }

        if (scanningRef.current && streamRef.current) {
          frameRef.current = requestAnimationFrame(scanFrame);
        }
      }

      frameRef.current = requestAnimationFrame(scanFrame);
    } catch (cameraError) {
      console.error("CAMERA ERROR:", cameraError);
      setError(`${cameraError.name}: ${cameraError.message}`);
      stopCamera();
    }
  }

  useEffect(() => {
    loadRecords();

    return () => {
      scanningRef.current = false;

      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }

      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#071426] px-4 py-8 text-white">
      <div className="mx-auto max-w-3xl">
        <a href="/dashboard" className="text-blue-300">
          ← Back to Dashboard
        </a>

        <header className="mb-7 mt-5">
          <p className="text-xs uppercase tracking-[.25em] text-blue-400">
            Faculty Attendance
          </p>
          <h1 className="mt-2 text-3xl font-bold">
            QR Code Scanner
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Scan the faculty QR code to record attendance.
          </p>
        </header>

        <section className="rounded-2xl border border-slate-700 bg-[#10223a] p-5">
          <h2 className="mb-4 font-semibold">Camera Scanner</h2>

          <div className="overflow-hidden rounded-xl bg-black">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className={`aspect-video w-full ${cameraOn ? "block" : "hidden"}`}
            />

            {!cameraOn && (
              <div className="flex aspect-video items-center justify-center text-slate-500">
                Camera Preview
              </div>
            )}
          </div>

          <div className="mt-4 flex gap-3">
            {!cameraOn ? (
              <button
                onClick={startCamera}
                className="rounded-xl bg-blue-600 px-5 py-3 font-semibold"
              >
                Start Camera
              </button>
            ) : (
              <button
                onClick={stopCamera}
                className="rounded-xl border border-slate-500 px-5 py-3"
              >
                Stop Camera
              </button>
            )}
          </div>

          <p className="mt-4 text-sm text-slate-300">{message}</p>

          {error && (
            <p className="mt-3 rounded-lg bg-red-500/10 p-3 text-sm text-red-300">
              {error}
            </p>
          )}
        </section>

        <section className="mt-5 rounded-2xl border border-slate-700 bg-[#10223a] p-5">
          <h2 className="font-semibold">Manual QR Test</h2>

          <textarea
            value={manualQR}
            onChange={(e) => setManualQR(e.target.value)}
            rows={3}
            placeholder='{"facultyName":"Sherilyn Tobias","facultyId":"FAC-001","classStart":"07:00"}'
            className="mt-3 w-full rounded-xl border border-slate-600 bg-[#071426] p-3 text-sm"
          />

          <button
            onClick={() => saveAttendance(manualQR)}
            className="mt-3 rounded-xl border border-blue-500 px-4 py-2 text-blue-300"
          >
            Save Test Scan
          </button>
        </section>

        {lastRecord && (
          <section className="mt-5 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-5">
            <h2 className="font-semibold text-emerald-300">
              Attendance Saved!
            </h2>

            <p className="mt-2 text-lg font-bold">
              {lastRecord.facultyName}
            </p>
            <p>{lastRecord.date}</p>
            <p>Class: {lastRecord.classStart}</p>
            <p>Scan Time: {lastRecord.time}</p>
            <p className="mt-2 font-semibold">{lastRecord.status}</p>

            <a href="/history" className="mt-4 inline-block text-blue-300 underline">
              View Attendance History →
            </a>
          </section>
        )}

        <section className="mt-5 rounded-2xl border border-slate-700 bg-[#10223a] p-5">
          <h2 className="mb-3 font-semibold">Latest Attendance</h2>

          {records.length === 0 ? (
            <p className="text-sm text-slate-400">No records yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="text-blue-300">
                    {["Record ID", "Faculty Name", "Date", "Time", "Status"].map((heading) => (
                      <th key={heading} className="border-b border-slate-600 p-3">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {records.slice(0, 5).map((record) => (
                    <tr key={record.recordId}>
                      {[record.recordId, record.facultyName, record.date, record.time, record.status].map((value, index) => (
                        <td key={index} className="border-b border-slate-700 p-3">
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

        <p className="mt-6 text-xs text-slate-500">
          Present: class start through 15 minutes after.
          Late: from the 16th minute onward.
          One record per faculty, date, and class schedule.
        </p>
      </div>
    </main>
  );
}

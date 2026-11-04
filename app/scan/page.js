
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
  <main className="min-h-screen bg-[#071426] px-5 py-8 text-white">
    <div className="mx-auto max-w-6xl">

      {/* Page Header */}
      <header className="mb-8">
        <a
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-blue-300 transition hover:text-white"
        >
          ← Back to Dashboard
        </a>

        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-400">
            Faculty Attendance System
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
            QR Code Scanner
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Scan the faculty QR code to record classroom attendance.
          </p>
        </div>
      </header>

      {/* Scanner Card */}
      <section className="overflow-hidden rounded-2xl border border-slate-700 bg-[#10223a] shadow-2xl shadow-black/20">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700 px-6 py-5">
          <div>
            <h2 className="text-lg font-bold">Camera Scanner</h2>
            <p className="mt-1 text-sm text-slate-400">
              Position the faculty QR code inside the camera view.
            </p>
          </div>

          <span className={`rounded-full px-4 py-2 text-xs font-semibold ${
            cameraOn
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-slate-700/60 text-slate-400"
          }`}>
            {cameraOn ? "● Camera Active" : "● Camera Inactive"}
          </span>
        </div>

        <div className="p-5 md:p-7">
          <div className="relative mx-auto max-w-3xl overflow-hidden rounded-2xl border border-blue-400/20 bg-black shadow-inner">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className={`aspect-video w-full object-cover ${
                cameraOn ? "block" : "hidden"
              }`}
            />

            {!cameraOn && (
              <div className="flex aspect-video flex-col items-center justify-center gap-4 bg-gradient-to-br from-[#0b1d33] to-[#071426]">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-blue-400/30 bg-blue-500/10 text-4xl text-blue-300">
                  ▦
                </div>
                <div className="text-center">
                  <p className="font-semibold text-slate-200">
                    Camera Preview
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Start the camera to begin scanning.
                  </p>
                </div>
              </div>
            )}

            {cameraOn && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="relative h-40 w-40 rounded-2xl border-2 border-blue-400 shadow-[0_0_25px_rgba(59,130,246,0.35)] md:h-56 md:w-56">
                  <span className="absolute -left-1 -top-1 h-5 w-5 border-l-4 border-t-4 border-blue-400" />
                  <span className="absolute -right-1 -top-1 h-5 w-5 border-r-4 border-t-4 border-blue-400" />
                  <span className="absolute -bottom-1 -left-1 h-5 w-5 border-b-4 border-l-4 border-blue-400" />
                  <span className="absolute -bottom-1 -right-1 h-5 w-5 border-b-4 border-r-4 border-blue-400" />
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {!cameraOn ? (
              <button
                onClick={startCamera}
                className="rounded-xl bg-blue-600 px-8 py-3 font-semibold shadow-lg shadow-blue-900/30 transition hover:bg-blue-500"
              >
                Start Camera
              </button>
            ) : (
              <button
                onClick={stopCamera}
                className="rounded-xl bg-red-600 px-8 py-3 font-semibold transition hover:bg-red-500"
              >
                Stop Camera
              </button>
            )}
          </div>

          <div className="mt-5 rounded-xl border border-slate-700 bg-[#0b192a] p-4 text-center">
            <p className="text-sm text-slate-300">{message}</p>

            {error && (
              <p className="mt-3 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
                {error}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Manual QR Test */}
      <section className="mt-6 rounded-2xl border border-slate-700 bg-[#10223a] p-6 shadow-xl shadow-black/10">
        <div className="mb-4">
          <h2 className="text-lg font-bold">Manual QR Test</h2>
          <p className="mt-1 text-sm text-slate-400">
            Enter QR data manually for testing.
          </p>
        </div>

        <textarea
          value={manualQR}
          onChange={(e) => setManualQR(e.target.value)}
          rows={3}
          placeholder='{"facultyName":"Sherilyn Tobias","facultyId":"FAC-001","classStart":"07:00"}'
          className="w-full rounded-xl border border-slate-600 bg-[#071426] p-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        />

        <button
          onClick={() => saveAttendance(manualQR)}
          className="mt-4 rounded-xl border border-blue-500/40 bg-blue-500/10 px-5 py-3 text-sm font-semibold text-blue-300 transition hover:bg-blue-500/20"
        >
          Save Test Scan
        </button>
      </section>

      {/* Latest Attendance */}
      <section className="mt-6 rounded-2xl border border-slate-700 bg-[#10223a] p-6 shadow-xl shadow-black/10">
        <div className="mb-5">
          <h2 className="text-lg font-bold">Latest Attendance</h2>
          <p className="mt-1 text-sm text-slate-400">
            Recently recorded faculty attendance.
          </p>
        </div>

        {records.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-700 bg-[#0b192a] py-12 text-center">
            <p className="text-slate-400">No attendance records yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-700">
            <table className="w-full min-w-[600px] border-collapse text-left text-sm">
              <thead className="bg-[#0b192a] text-blue-300">
                <tr>
                  {["Record ID", "Faculty Name", "Date", "Time", "Status"].map((heading) => (
                    <th key={heading} className="px-5 py-4 font-semibold">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.slice(0, 5).map((record) => (
                  <tr
                    key={record.recordId}
                    className="border-t border-slate-700 transition hover:bg-white/[0.03]"
                  >
                    <td className="px-5 py-4 text-slate-400">
                      {record.recordId}
                    </td>
                    <td className="px-5 py-4 font-medium text-white">
                      {record.facultyName}
                    </td>
                    <td className="px-5 py-4 text-slate-300">
                      {record.date}
                    </td>
                    <td className="px-5 py-4 text-slate-300">
                      {record.time}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        record.status === "Present"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : record.status === "Late"
                          ? "bg-amber-500/10 text-amber-400"
                          : "bg-red-500/10 text-red-400"
                      }`}>
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

      <footer className="mt-8 text-center text-xs text-slate-600">
        Faculty Attendance Monitoring System
      </footer>
    </div>
  </main>
);
}

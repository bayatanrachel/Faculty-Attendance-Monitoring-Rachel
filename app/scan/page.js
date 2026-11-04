
"use client";

import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "faculty-attendance-records";

function getRecords() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
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
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(data.classStart || "")
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

  const [cameraOn, setCameraOn] = useState(false);
  const [message, setMessage] = useState(
    "Pindutin ang Start Camera para mag-scan."
  );
  const [error, setError] = useState("");
  const [manualQR, setManualQR] = useState("");
  const [lastRecord, setLastRecord] = useState(null);

  function stopCamera() {
    scanningRef.current = false;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraOn(false);
  }

  function saveAttendance(raw) {
    if (scanningRef.current === false && cameraOn) return;

    const qr = parseQR(raw);

    if (!qr) {
      setError(
        "Invalid QR. Kailangan ang facultyName, facultyId, at classStart."
      );
      return;
    }

    const now = new Date();
    const [hour, minute] = qr.classStart.split(":").map(Number);

    const classStart = new Date(now);
    classStart.setHours(hour, minute, 0, 0);

    const cutoff = new Date(classStart.getTime() + 15 * 60 * 1000);

    if (now < classStart) {
      setError("Hindi pa nagsisimula ang class schedule.");
      return;
    }

    const status = now <= cutoff ? "Present" : "Late";

    const date = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
    ].join("-");

    const sessionKey =
      qr.facultyId + "|" + date + "|" + qr.classStart;

    const records = getRecords();

    if (records.some((record) => record.sessionKey === sessionKey)) {
      setError("May existing attendance record na para sa schedule na ito.");
      return;
    }

    const record = {
      id: crypto.randomUUID(),
      sessionKey,
      facultyName: qr.facultyName,
      facultyId: qr.facultyId,
      date,
      classStart: qr.classStart,
      scanTime: now.toLocaleTimeString(),
      status,
    };

    records.unshift(record);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));

    setLastRecord(record);
    setMessage("Attendance successfully recorded!");
    setError("");
    stopCamera();
  }

  async function startCamera() {
    setError("");

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Hindi available ang camera. Gumamit ng HTTPS at updated browser.");
      return;
    }

    if (!("BarcodeDetector" in window)) {
      setError("Hindi suportado ng browser ang QR scanner. Subukan ang updated Chrome.");
      return;
    }

    try {
      const detector = new window.BarcodeDetector({
        formats: ["qr_code"],
      });

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });

      streamRef.current = stream;
      scanningRef.current = true;
      setCameraOn(true);

      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      setMessage("Itapat ang QR code sa camera.");

      async function scanFrame() {
        if (!scanningRef.current || !videoRef.current) return;

        try {
          const codes = await detector.detect(videoRef.current);

          if (codes.length > 0 && codes[0].rawValue) {
            saveAttendance(codes[0].rawValue);
          }
        } catch (err) {
          console.error(err);
        }

        if (scanningRef.current) {
          requestAnimationFrame(scanFrame);
        }
      }

      requestAnimationFrame(scanFrame);
    } catch (err) {
      setError("Hindi mabuksan ang camera. Payagan ang camera permission.");
      stopCamera();
    }
  }

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
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
              muted
              playsInline
              className={cameraOn ? "block aspect-video w-full" : "hidden"}
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
            placeholder='{"facultyName":"Juan Dela Cruz","facultyId":"FAC-001","classStart":"07:00"}'
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
            <p>Scan Time: {lastRecord.scanTime}</p>
            <p className="mt-2 font-semibold">{lastRecord.status}</p>

            <a href="/history" className="mt-4 inline-block text-blue-300 underline">
              View Attendance History →
            </a>
          </section>
        )}

        <p className="mt-6 text-xs text-slate-500">
          Present: within 15 minutes after class starts.
          Late: from the 16th minute onward.
          One record per faculty, date, and class schedule.
        </p>

      </div>
    </main>
  );
}


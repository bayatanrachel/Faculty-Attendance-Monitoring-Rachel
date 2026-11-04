"use client";

import { useEffect, useRef, useState } from "react";

const KEY = "faculty-attendance-records";

export default function ScanPage() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const busyRef = useRef(false);

  const [cameraOn, setCameraOn] = useState(false);
  const [message, setMessage] = useState("Ready to scan.");
  const [error, setError] = useState("");
  const [records, setRecords] = useState([]);

  function stopCamera() {
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
      setError("Invalid QR code.");
      return;
    }

    const facultyName = String(qr.facultyName || "").trim();
    const classStart = String(qr.classStart || "");

    if (!facultyName || !/^([01]\d|2[0-3]):[0-5]\d$/.test(classStart)) {
      setError("QR must contain facultyName and classStart.");
      return;
    }

    const now = new Date();
    const [hour, minute] = classStart.split(":").map(Number);
    const start = new Date(now);
    start.setHours(hour, minute, 0, 0);
    const cutoff = new Date(start.getTime() + 15 * 60000);

    if (now < start) {
      setError("Hindi pa nagsisimula ang class.");
      return;
    }

    const date = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
    ].join("-");

    const saved = JSON.parse(localStorage.getItem(KEY) || "[]");

    const duplicate = saved.some(
      (r) =>
        r.facultyName === facultyName &&
        r.date === date &&
        r.classStart === classStart
    );

    if (duplicate) {
      setError("May existing record na para sa class na ito.");
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
    setMessage("Attendance successfully recorded!");
    setError("");
    stopCamera();
    busyRef.current = false;
  }

  async function startCamera() {
    setError("");

    if (!("BarcodeDetector" in window)) {
      setError("QR scanner is not supported by this browser. Try updated Chrome.");
      return;
    }

    try {
      const detector = new window.BarcodeDetector({
        formats: ["qr_code"],
      });

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      streamRef.current = stream;
      setCameraOn(true);
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      async function scan() {
        if (!streamRef.current || busyRef.current) return;

        try {
          const codes = await detector.detect(videoRef.current);
          if (codes.length) saveRecord(codes[0].rawValue);
        } catch (e) {
          console.error(e);
        }

        if (streamRef.current) requestAnimationFrame(scan);
      }

      requestAnimationFrame(scan);
    } catch {
      setError("Camera permission denied or camera unavailable.");
      stopCamera();
    }
  }

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#0a1423] p-6 text-white">
      <div className="mx-auto max-w-3xl">
        <a href="/dashboard" className="text-cyan-300">
          ← Dashboard
        </a>

        <h1 className="mb-2 mt-6 text-3xl font-bold">
          QR Code Scanner
        </h1>
        <p className="mb-6 text-slate-400">
          Scan the faculty QR code to record attendance.
        </p>

        <section className="rounded-2xl border border-slate-700 bg-[#122238] p-5">
          <video
            ref={videoRef}
            muted
            playsInline
            className={cameraOn ? "w-full rounded-xl" : "hidden"}
          />

          {!cameraOn && (
            <div className="flex aspect-video items-center justify-center rounded-xl bg-black text-slate-400">
              Camera Preview
            </div>
          )}

          <div className="mt-5 flex gap-3">
            {!cameraOn ? (
              <button
                onClick={startCamera}
                className="rounded-lg bg-blue-600 px-5 py-3 font-semibold"
              >
                Start Camera
              </button>
            ) : (
              <button
                onClick={stopCamera}
                className="rounded-lg border border-slate-500 px-5 py-3"
              >
                Stop Camera
              </button>
            )}
          </div>

          <p className="mt-4 text-sm text-slate-300">{message}</p>
          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        </section>

        <section className="mt-5 rounded-2xl border border-slate-700 bg-[#122238] p-5">
          <h2 className="font-semibold">Latest Attendance</h2>
          {records.length === 0 ? (
            <p className="mt-3 text-sm text-slate-400">No records yet.</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-700 text-cyan-300">
                    <th className="p-2">Record ID</th>
                    <th className="p-2">Faculty Name</th>
                    <th className="p-2">Date</th>
                    <th className="p-2">Time</th>
                    <th className="p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {records.slice(0, 5).map((r) => (
                    <tr key={r.recordId} className="border-b border-slate-700">
                      <td className="p-2">{r.recordId}</td>
                      <td className="p-2">{r.facultyName}</td>
                      <td className="p-2">{r.date}</td>
                      <td className="p-2">{r.time}</td>
                      <td className="p-2">{r.status}</td>
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

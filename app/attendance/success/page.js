

"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function AttendanceSuccessContent() {
  const params = useSearchParams();

  const faculty = params.get("faculty") || "Sherilyn Tobias";
  const date = params.get("date") || "—";
  const time = params.get("time") || "—";
  const status = (params.get("status") || "PRESENT").toUpperCase();

  return (
    <main className="min-h-screen bg-[#0b1224] flex items-center justify-center p-5 text-white">
      <section className="w-full max-w-md rounded-3xl border border-[#263653] bg-[#14213d] p-8 text-center shadow-2xl">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#153f36] text-5xl text-[#55e6a5]">
          ✓
        </div>

        <p className="mb-2 text-sm font-semibold tracking-[0.2em] text-[#55e6a5]">
          ATTENDANCE CONFIRMATION
        </p>

        <h1 className="text-2xl font-bold">
          Attendance Successfully Recorded!
        </h1>

        <p className="mt-3 text-sm text-[#aab8ce]">
          Your attendance has been saved successfully.
        </p>

        <div className="mt-8 rounded-2xl bg-[#0e1930] p-5 text-left">
          <p className="mb-5 text-xs font-bold tracking-widest text-[#8294b1]">
            ATTENDANCE DETAILS
          </p>

          <div className="mb-5 flex justify-between gap-4 text-sm">
            <span className="text-[#aab8ce]">Faculty Name</span>
            <strong>{faculty}</strong>
          </div>

          <div className="mb-5 flex justify-between gap-4 text-sm">
            <span className="text-[#aab8ce]">Date</span>
            <strong>{date}</strong>
          </div>

          <div className="mb-5 flex justify-between gap-4 text-sm">
            <span className="text-[#aab8ce]">Time</span>
            <strong>{time}</strong>
          </div>

          <div className="flex justify-between gap-4 text-sm">
            <span className="text-[#aab8ce]">Status</span>
            <strong
              className={
                status === "PRESENT"
                  ? "text-[#55e6a5]"
                  : "text-amber-400"
              }
            >
              {status}
            </strong>
          </div>
        </div>

        <p className="mt-6 text-xs text-[#8294b1]">
          QR Code-Based Attendance Monitoring System
        </p>
      </section>
    </main>
  );
}

export default function AttendanceSuccess() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#0b1224] flex items-center justify-center text-white">
          Loading attendance details...
        </main>
      }
    >
      <AttendanceSuccessContent />
    </Suspense>
  );
}

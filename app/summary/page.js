
"use client";

import { useEffect, useMemo, useState } from "react";
import LogoutButton from "@/components/LogoutButton";

const summaryItems = [
  { label: "Present", color: "#34D399", light: "#6EE7B7" },
  { label: "Late", color: "#FBBF24", light: "#FCD34D" },
  { label: "Absent", color: "#F87171", light: "#FF929C" },
  { label: "Excused", color: "#A78BFA", light: "#C4B5FD" },
];

function getStatusLabel(value) {
  const status = String(value || "").trim().toLowerCase();

  const labels = {
    p: "Present",
    present: "Present",
    l: "Late",
    late: "Late",
    a: "Absent",
    absent: "Absent",
    e: "Excused",
    excused: "Excused",
  };

  return labels[status] || "Other";
}

function getDateKey(value) {
  if (!value) return "";

  const date = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2}/.test(date)) {
    return date.slice(0, 10);
  }

  const usDate = date.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

  if (usDate) {
    const [, month, day, year] = usDate;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "";

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(date) {
  if (!date) return "—";

  const parsed = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) return date;

  return parsed.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getWeekStart(date) {
  const start = new Date(date);
  const day = start.getDay();

  start.setDate(start.getDate() - (day === 0 ? 6 : day - 1));

  return getLocalDateKey(start);
}

function getMonthStart(date) {
  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}-01`;
}

export default function AttendanceSummary() {
  const [records, setRecords] = useState([]);
  const [period, setPeriod] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadRecords() {
      try {
        const response = await fetch("/api/attendance", {
          method: "GET",
          cache: "no-store",
        });

        if (response.status === 401) {
          window.location.replace("/");
          return;
        }

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error || "Unable to load attendance records."
          );
        }

        if (active) {
          const databaseRecords = Array.isArray(result.records)
            ? result.records.map((row) => ({
                recordId: row.record_id,
                facultyName: row.faculty_name,
                date: row.date,
                time: row.time,
                status: row.status,
              }))
            : [];

          setRecords(databaseRecords);
          setErrorMessage("");
        }
      } catch (error) {
        if (active) {
          setErrorMessage(
            error.message || "Unable to load attendance records."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadRecords();

    window.addEventListener("focus", loadRecords);

    return () => {
      active = false;
      window.removeEventListener("focus", loadRecords);
    };
  }, []);

  const filteredRecords = useMemo(() => {
    const today = new Date();
    const todayKey = getLocalDateKey(today);
    const weekStart = getWeekStart(today);
    const monthStart = getMonthStart(today);

    return records.filter((record) => {
      const recordDate = getDateKey(record.date);

      if (!recordDate) return false;

      if (period === "today") {
        return recordDate === todayKey;
      }

      if (period === "week") {
        return recordDate >= weekStart && recordDate <= todayKey;
      }

      if (period === "month") {
        return recordDate >= monthStart && recordDate <= todayKey;
      }

      if (period === "custom") {
        if (startDate && recordDate < startDate) return false;
        if (endDate && recordDate > endDate) return false;
      }

      return true;
    });
  }, [records, period, startDate, endDate]);

  const summary = useMemo(() => {
    return summaryItems.map((item) => {
      const count = filteredRecords.filter(
        (record) => getStatusLabel(record.status) === item.label
      ).length;

      const percentage = filteredRecords.length
        ? (count / filteredRecords.length) * 100
        : 0;

      return {
        ...item,
        count,
        percentage,
      };
    });
  }, [filteredRecords]);

  const total = filteredRecords.length;

  const otherCount = filteredRecords.filter(
    (record) => getStatusLabel(record.status) === "Other"
  ).length;

  const recognizedCount = total - otherCount;

  const donutBackground = (() => {
    if (!recognizedCount) return "#26384D";

    let position = 0;

    const stops = summary.map((item) => {
      const start = position;
      position += (item.count / total) * 100;

      return `${item.color} ${start}% ${position}%`;
    });

    if (otherCount > 0) {
      const start = position;
      position += (otherCount / total) * 100;
      stops.push(`#64748B ${start}% ${position}%`);
    }

    return `conic-gradient(${stops.join(", ")})`;
  })();

  const reportPeriod = (() => {
    if (period === "today") return "Today";
    if (period === "week") return "This Week";
    if (period === "month") return "This Month";

    if (period === "custom") {
      if (startDate && endDate) {
        return `${formatDate(startDate)} – ${formatDate(endDate)}`;
      }

      if (startDate) return `From ${formatDate(startDate)}`;
      if (endDate) return `Until ${formatDate(endDate)}`;

      return "Custom Date Range";
    }

    return "All Recorded Dates";
  })();

  function resetFilters() {
    setPeriod("all");
    setStartDate("");
    setEndDate("");
  }

  return (
    <main className="dashboard-page summary-page">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="logo-icon">QR</div>
          <span>
            FACULTY
            <br />
            ATTENDANCE
          </span>
        </div>

        <nav className="sidebar-nav">
          <a className="nav-link" href="/dashboard">
            Dashboard
          </a>
          <a className="nav-link" href="/history">
            Attendance History
          </a>
          <a className="nav-link active" href="/summary">
            Attendance Summary
          </a>
          <a className="nav-link" href="/scan">
            QR Scanner
          </a>
        </nav>

        <LogoutButton />
      </aside>

      <section className="dashboard-content summary-content">
        <header className="dashboard-header summary-header">
          <div>
            <p className="welcome-label">FACULTY REPORT</p>
            <h1>Attendance Summary</h1>
            <p className="dashboard-subtitle">
              A detailed overview of faculty attendance records.
            </p>
          </div>

          <div className="faculty-avatar">ST</div>
        </header>

        {loading && (
          <p style={{ color: "#9bd8fa", marginBottom: "20px" }}>
            Loading attendance summary...
          </p>
        )}

        {errorMessage && (
          <p
            role="alert"
            style={{ color: "#ff929c", marginBottom: "20px" }}
          >
            {errorMessage}
          </p>
        )}

        <section className="report-information">
          <div className="report-heading">
            <div className="report-icon">
              <span>QR</span>
            </div>

            <div>
              <p className="report-eyebrow">OFFICIAL ATTENDANCE REPORT</p>
              <h2>Faculty Attendance Overview</h2>
              <p>QR Code-Based Attendance Monitoring System</p>
            </div>
          </div>

          <div className="report-details">
            <div>
              <span>FACULTY NAME</span>
              <strong>Sherilyn P. Tobias</strong>
            </div>

            <div>
              <span>SECTION</span>
              <strong>3A</strong>
            </div>

            <div>
              <span>REPORTING PERIOD</span>
              <strong>{reportPeriod}</strong>
            </div>

            <div>
              <span>RECORDS INCLUDED</span>
              <strong>{total}</strong>
            </div>
          </div>
        </section>

        <section className="summary-report-section">
          <div className="summary-section-heading">
            <div>
              <p className="welcome-label">REPORT BREAKDOWN</p>
              <h2>Attendance Distribution</h2>
              <p>
                Attendance count and percentage for each status.
              </p>
            </div>
          </div>

          <div className="distribution-layout">
            <div className="donut-area">
              <div
                className="donut-chart"
                style={{ background: donutBackground }}
                role="img"
                aria-label={`Attendance distribution for ${total} records`}
              >
                <div className="donut-center">
                  <strong>{total}</strong>
                  <span>Total Records</span>
                </div>
              </div>
            </div>

            <div className="distribution-list">
              {summary.map((item) => (
                <div className="distribution-item" key={item.label}>
                  <div className="distribution-top">
                    <div className="distribution-label">
                      <span
                        className="legend-dot"
                        style={{ background: item.color }}
                      />
                      <strong>{item.label}</strong>
                    </div>

                    <div className="distribution-value">
                      <strong>{item.count}</strong>
                      <span>{item.percentage.toFixed(1)}%</span>
                    </div>
                  </div>

                  <div className="distribution-track">
                    <div
                      className="distribution-fill"
                      style={{
                        width: `${item.percentage}%`,
                        background: item.color,
                      }}
                    />
                  </div>
                </div>
              ))}

              {otherCount > 0 && (
                <div className="distribution-item">
                  <div className="distribution-top">
                    <div className="distribution-label">
                      <span
                        className="legend-dot"
                        style={{ background: "#64748B" }}
                      />
                      <strong>Other / Unknown</strong>
                    </div>

                    <div className="distribution-value">
                      <strong>{otherCount}</strong>
                      <span>
                        {total
                          ? ((otherCount / total) * 100).toFixed(1)
                          : "0.0"}
                        %
                      </span>
                    </div>
                  </div>

                  <div className="distribution-track">
                    <div
                      className="distribution-fill"
                      style={{
                        width: `${(otherCount / total) * 100}%`,
                        background: "#64748B",
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="report-table-section">
          <div className="report-table-heading">
            <div>
              <p className="welcome-label">SUMMARY DETAILS</p>
              <h2>Attendance Breakdown Report</h2>
              <p>
                Consolidated attendance results for the selected period.
              </p>
            </div>

            <button
              type="button"
              className="print-button"
              onClick={() => window.print()}
            >
              <span>▤</span>
              Print / Save as PDF
            </button>
          </div>

          <div className="report-table-wrap">
            <table className="report-table">
              <thead>
                <tr>
                  <th>Attendance Status</th>
                  <th>Number of Records</th>
                  <th>Percentage</th>
                </tr>
              </thead>

              <tbody>
                {summary.map((item) => (
                  <tr key={item.label}>
                    <td>
                      <span className="table-status">
                        <span
                          className="legend-dot"
                          style={{ background: item.color }}
                        />
                        {item.label}
                      </span>
                    </td>
                    <td>{item.count}</td>
                    <td>{item.percentage.toFixed(1)}%</td>
                  </tr>
                ))}

                {otherCount > 0 && (
                  <tr>
                    <td>Other / Unknown</td>
                    <td>{otherCount}</td>
                    <td>
                      {((otherCount / total) * 100).toFixed(1)}%
                    </td>
                  </tr>
                )}

                <tr className="report-total-row">
                  <td>TOTAL</td>
                  <td>{total}</td>
                  <td>{total ? "100.0%" : "0.0%"}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="period-section no-print">
          <div className="period-heading">
            <div>
              <p className="welcome-label">REPORT SETTINGS</p>
              <h2>Reporting Period</h2>
              <p>Select which attendance records to include.</p>
            </div>
          </div>

          <div className="period-controls">
            <label htmlFor="report-period">Select Period</label>

            <select
              id="report-period"
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
            >
              <option value="all">All Recorded Dates</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="custom">Custom Date Range</option>
            </select>

            {period === "custom" && (
              <div className="custom-date-controls">
                <div>
                  <label htmlFor="start-date">Start Date</label>
                  <input
                    id="start-date"
                    type="date"
                    value={startDate}
                    max={endDate || undefined}
                    onChange={(event) => setStartDate(event.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="end-date">End Date</label>
                  <input
                    id="end-date"
                    type="date"
                    value={endDate}
                    min={startDate || undefined}
                    onChange={(event) => setEndDate(event.target.value)}
                  />
                </div>
              </div>
            )}

            <button
              type="button"
              className="reset-button"
              onClick={resetFilters}
            >
              Reset Period
            </button>
          </div>
        </section>

        <footer className="summary-footer">
          QR Code-Based Attendance Monitoring System
        </footer>
      </section>

      <style jsx>{`
        .summary-content {
          min-width: 0;
        }

        .summary-header {
          margin-bottom: 36px;
        }

        .summary-header h1 {
          font-size: clamp(30px, 3vw, 38px);
          font-weight: 750;
          letter-spacing: -1.2px;
        }

        .summary-header .dashboard-subtitle {
          font-size: 16px;
          line-height: 1.7;
        }

        .report-information {
          padding: 26px 0 28px;
          border-top: 1px solid #293e55;
          border-bottom: 1px solid #293e55;
          margin-bottom: 38px;
        }

        .report-heading {
          display: flex;
          align-items: center;
          gap: 17px;
          margin-bottom: 27px;
        }

        .report-icon {
          width: 55px;
          height: 55px;
          flex-shrink: 0;
          display: grid;
          place-items: center;
          border-radius: 13px;
          background: rgba(85, 188, 233, 0.12);
          border: 1px solid rgba(85, 188, 233, 0.3);
          color: #75bdf0;
          font-size: 17px;
          font-weight: 800;
        }

        .report-eyebrow {
          color: #75bdf0;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 1.2px;
          margin-bottom: 6px;
        }

        .report-heading h2 {
          color: #e8eff6;
          font-size: 23px;
          font-weight: 750;
          margin-bottom: 5px;
        }

        .report-heading p:last-child {
          color: #aebed0;
          font-size: 14px;
        }

        .report-details {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 22px 35px;
          padding-left: 72px;
        }

        .report-details div {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .report-details span {
          color: #8299b1;
          font-size: 12px;
          font-weight: 750;
          letter-spacing: 0.7px;
        }

        .report-details strong {
          color: #edf4fb;
          font-size: 16px;
          font-weight: 650;
        }

        .summary-report-section {
          margin-bottom: 43px;
        }

        .summary-section-heading,
        .report-table-heading,
        .period-heading {
          margin-bottom: 23px;
        }

        .summary-section-heading h2,
        .report-table-heading h2,
        .period-heading h2 {
          color: #e8eff6;
          font-size: 24px;
          font-weight: 750;
          margin-bottom: 7px;
        }

        .summary-section-heading p:last-child,
        .report-table-heading p:last-child,
        .period-heading p:last-child {
          color: #aebed0;
          font-size: 15px;
          line-height: 1.6;
        }

        .distribution-layout {
          display: grid;
          grid-template-columns: minmax(190px, 0.8fr) minmax(280px, 1.5fr);
          align-items: center;
          gap: 50px;
          padding: 27px 0;
          border-top: 1px solid #293e55;
          border-bottom: 1px solid #293e55;
        }

        .donut-area {
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .donut-chart {
          width: 210px;
          height: 210px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          position: relative;
          animation: chartAppear 0.8s ease both;
        }

        .donut-center {
          width: 142px;
          height: 142px;
          background: #0a1220;
          border: 1px solid #293e55;
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        .donut-center strong {
          color: #f0f6ff;
          font-size: 37px;
          font-weight: 800;
          line-height: 1.1;
        }

        .donut-center span {
          color: #aebed0;
          font-size: 13px;
          margin-top: 7px;
        }

        .distribution-list {
          display: flex;
          flex-direction: column;
          gap: 23px;
        }

        .distribution-item {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .distribution-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
        }

        .distribution-label {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #e8eff6;
          font-size: 16px;
        }

        .distribution-value {
          display: flex;
          align-items: center;
          gap: 14px;
          white-space: nowrap;
        }

        .distribution-value strong {
          color: #f0f6ff;
          font-size: 16px;
        }

        .distribution-value span {
          color: #aebed0;
          font-size: 15px;
          min-width: 55px;
          text-align: right;
        }

        .legend-dot {
          display: inline-block;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .distribution-track {
          height: 9px;
          background: #17283d;
          border-radius: 20px;
          overflow: hidden;
        }

        .distribution-fill {
          height: 100%;
          border-radius: 20px;
          transition: width 0.5s ease;
        }

        .report-table-section {
          margin-bottom: 40px;
        }

        .report-table-heading {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 20px;
        }

        .print-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          padding: 12px 17px;
          border: 1px solid #3989b7;
          border-radius: 9px;
          background: rgba(65, 157, 205, 0.12);
          color: #9bd8fa;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: 0.2s ease;
          white-space: nowrap;
        }

        .print-button:hover {
          background: rgba(65, 157, 205, 0.23);
          border-color: #75bdf0;
          transform: translateY(-2px);
        }

        .report-table-wrap {
          overflow-x: auto;
          border-top: 1px solid #293e55;
          border-bottom: 1px solid #293e55;
        }

        .report-table {
          width: 100%;
          min-width: 480px;
          border-collapse: collapse;
          text-align: left;
        }

        .report-table th {
          padding: 17px 18px;
          color: #9eb4ca;
          background: rgba(23, 40, 61, 0.7);
          font-size: 13px;
          font-weight: 750;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        .report-table td {
          padding: 18px;
          border-top: 1px solid rgba(41, 62, 85, 0.7);
          color: #e0eaf4;
          font-size: 16px;
        }

        .table-status {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-weight: 650;
        }

        .report-total-row td {
          color: #f0f6ff;
          font-weight: 800;
          background: rgba(85, 188, 233, 0.07);
          border-top: 1px solid #38536f;
        }

        .period-section {
          padding-top: 27px;
          border-top: 1px solid #293e55;
          margin-bottom: 35px;
        }

        .period-controls {
          display: flex;
          align-items: flex-end;
          gap: 15px;
          flex-wrap: wrap;
        }

        .period-controls > label,
        .custom-date-controls label {
          display: block;
          color: #b9c9d9;
          font-size: 14px;
          font-weight: 650;
          margin-bottom: 8px;
        }

        .period-controls select,
        .custom-date-controls input {
          min-width: 190px;
          height: 46px;
          padding: 0 13px;
          border: 1px solid #293e55;
          border-radius: 8px;
          outline: none;
          background: #111e30;
          color: #e8eff6;
          font-size: 15px;
        }

        .period-controls select:focus,
        .custom-date-controls input:focus {
          border-color: #75bdf0;
        }

        .custom-date-controls {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .custom-date-controls input {
          display: block;
        }

        .custom-date-controls input::-webkit-calendar-picker-indicator {
          filter: invert(0.8);
          cursor: pointer;
        }

        .reset-button {
          height: 46px;
          padding: 0 17px;
          border: 1px solid #38536f;
          border-radius: 8px;
          background: transparent;
          color: #b8dfff;
          font-size: 14px;
          font-weight: 650;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .reset-button:hover {
          background: rgba(117, 189, 240, 0.1);
          border-color: #75bdf0;
        }

        .summary-footer {
          padding-top: 20px;
          border-top: 1px solid #293e55;
          color: #8295aa;
          font-size: 13px;
          text-align: center;
        }

        @keyframes chartAppear {
          from {
            opacity: 0;
            transform: scale(0.88);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @media (max-width: 850px) {
          .distribution-layout {
            grid-template-columns: 1fr;
            gap: 30px;
          }

          .donut-chart {
            width: 190px;
            height: 190px;
          }

          .donut-center {
            width: 130px;
            height: 130px;
          }

          .report-details {
            padding-left: 0;
          }

          .report-table-heading {
            align-items: flex-start;
            flex-direction: column;
          }
        }

        @media (max-width: 520px) {
          .summary-header h1 {
            font-size: 28px;
          }

          .report-heading h2 {
            font-size: 19px;
          }

          .report-details {
            grid-template-columns: 1fr;
            gap: 18px;
          }

          .summary-section-heading h2,
          .report-table-heading h2,
          .period-heading h2 {
            font-size: 21px;
          }

          .distribution-value {
            gap: 8px;
          }

          .distribution-label {
            font-size: 15px;
          }

          .distribution-value strong,
          .distribution-value span {
            font-size: 14px;
          }

          .period-controls {
            align-items: stretch;
            flex-direction: column;
          }

          .period-controls select,
          .custom-date-controls input,
          .reset-button {
            width: 100%;
          }

          .custom-date-controls {
            flex-direction: column;
          }

          .print-button {
            width: 100%;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .donut-chart {
            animation: none;
          }

          .distribution-fill,
          .print-button,
          .reset-button {
            transition: none;
          }
        }

        @media print {
          :global(body) {
            background: white !important;
            color: black !important;
          }

          :global(.sidebar),
          .summary-header,
          .no-print,
          .print-button {
            display: none !important;
          }

          :global(.dashboard-page) {
            display: block !important;
            min-height: auto !important;
            background: white !important;
          }

          :global(.dashboard-content),
          .summary-content {
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            color: black !important;
          }

          .report-information,
          .distribution-layout,
          .report-table-wrap {
            border-color: #ccc !important;
          }

          .report-heading h2,
          .report-details strong,
          .summary-section-heading h2,
          .report-table-heading h2,
          .report-table td,
          .report-table th,
          .distribution-label,
          .distribution-value strong,
          .donut-center strong {
            color: #111 !important;
          }

          .report-eyebrow,
          .report-details span,
          .summary-section-heading p:last-child,
          .report-table-heading p:last-child,
          .distribution-value span,
          .donut-center span {
            color: #444 !important;
          }

          .donut-center {
            background: white !important;
            border-color: #ccc !important;
          }

          .report-table th {
            background: #eee !important;
          }

          .report-total-row td {
            background: #eee !important;
          }

          .summary-footer {
            color: #555 !important;
          }
        }
      `}</style>
    </main>
  );
}

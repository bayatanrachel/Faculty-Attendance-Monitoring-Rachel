
"use client";

import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "faculty-attendance-records";

const statusStyles = {
  Present: {
    color: "#6ee7b7",
    background: "rgba(16,185,129,.14)",
    border: "1px solid rgba(16,185,129,.35)",
  },
  Late: {
    color: "#fbbf24",
    background: "rgba(245,158,11,.14)",
    border: "1px solid rgba(245,158,11,.35)",
  },
  Absent: {
    color: "#ff929c",
    background: "rgba(239,68,68,.14)",
    border: "1px solid rgba(239,68,68,.35)",
  },
  Excused: {
    color: "#c4b5fd",
    background: "rgba(139,92,246,.14)",
    border: "1px solid rgba(139,92,246,.35)",
  },
};

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

  return labels[status] || (value ? String(value).trim() : "Unknown");
}

function getDateKey(value) {
  if (!value) return "";

  const dateString = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2}/.test(dateString)) {
    return dateString.slice(0, 10);
  }

  const parsed = new Date(dateString);

  if (Number.isNaN(parsed.getTime())) return "";

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function AttendanceHistory() {
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");

  useEffect(() => {
    function loadRecords() {
      try {
        const saved = JSON.parse(
          localStorage.getItem(STORAGE_KEY) || "[]"
        );

        setRecords(Array.isArray(saved) ? saved : []);
      } catch {
        setRecords([]);
      }
    }

    loadRecords();

    window.addEventListener("storage", loadRecords);
    window.addEventListener("focus", loadRecords);

    return () => {
      window.removeEventListener("storage", loadRecords);
      window.removeEventListener("focus", loadRecords);
    };
  }, []);

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const status = getStatusLabel(record.status);

      const searchText = [
        record.recordId,
        record.facultyName,
        record.date,
        record.time,
        status,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = searchText.includes(
        search.trim().toLowerCase()
      );

      const matchesStatus =
        statusFilter === "All" || status === statusFilter;

      const matchesDate =
        !dateFilter || getDateKey(record.date) === dateFilter;

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [records, search, statusFilter, dateFilter]);

  function clearFilters() {
    setSearch("");
    setStatusFilter("All");
    setDateFilter("");
  }

  return (
    <main className="dashboard-page history-page">
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
          <a className="nav-link active" href="/history">
            Attendance History
          </a>
          <a className="nav-link" href="/summary">
            Attendance Summary
          </a>
          <a className="nav-link" href="/scan">
            QR Scanner
          </a>
        </nav>

        <a className="logout-link" href="/">
          Log Out
        </a>
      </aside>

      <section className="dashboard-content history-content">
        <header className="dashboard-header history-header">
          <div>
            <p className="welcome-label">FACULTY PORTAL</p>
            <h1>Attendance History</h1>
            <p className="dashboard-subtitle">
              Review and manage recorded faculty attendance.
            </p>
          </div>

          <div className="faculty-avatar">ST</div>
        </header>

        <section className="history-section">
          <div className="history-title-row">
            <div>
              <h2>Attendance Records</h2>
              <p>
                Showing {filteredRecords.length} of {records.length} records
              </p>
            </div>
          </div>

          <div className="history-toolbar">
            <div className="history-search">
              <span className="search-icon">⌕</span>
              <input
                type="search"
                placeholder="Search records, faculty, or status..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Search attendance records"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter by status"
            >
              <option value="All">All Status</option>
              <option value="Present">Present</option>
              <option value="Late">Late</option>
              <option value="Absent">Absent</option>
              <option value="Excused">Excused</option>
            </select>

            <input
              type="date"
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
              aria-label="Filter by date"
            />

            <button
              type="button"
              className="clear-filters"
              onClick={clearFilters}
            >
              Clear
            </button>
          </div>

          <div className="history-table-wrap">
            <table className="history-table">
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
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan="5">
                      <div className="history-empty-state">
                        <span className="empty-symbol">⌕</span>
                        <strong>
                          {records.length === 0
                            ? "No attendance records yet"
                            : "No matching records found"}
                        </strong>
                        <p>
                          {records.length === 0
                            ? "Attendance records will appear here once they are recorded."
                            : "Try changing your search or filters."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record, index) => {
                    const status = getStatusLabel(record.status);
                    const badgeStyle =
                      statusStyles[status] || {
                        color: "#cbd5e1",
                        background: "rgba(148,163,184,.12)",
                        border: "1px solid #40516a",
                      };

                    return (
                      <tr key={record.recordId || `${record.date}-${record.time}-${index}`}>
                        <td className="record-id">
                          {record.recordId || "—"}
                        </td>
                        <td className="faculty-name">
                          {record.facultyName || "—"}
                        </td>
                        <td>{record.date || "—"}</td>
                        <td>{record.time || "—"}</td>
                        <td>
                          <span
                            className="history-status"
                            style={badgeStyle}
                          >
                            <span className="status-dot" />
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        <footer className="history-footer">
          Faculty Attendance Monitoring System
        </footer>
      </section>

      <style jsx>{`
        .history-content {
          min-width: 0;
        }

        .history-header {
          margin-bottom: 42px;
        }

        .history-header h1 {
          font-size: clamp(30px, 3vw, 38px);
          font-weight: 750;
          letter-spacing: -1.2px;
        }

        .history-header .dashboard-subtitle {
          font-size: 16px;
          line-height: 1.7;
        }

        .history-section {
          width: 100%;
          animation: historyFadeIn 0.55s ease both;
        }

        .history-title-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .history-title-row h2 {
          font-size: 24px;
          font-weight: 700;
          color: #e8eff6;
          margin-bottom: 7px;
        }

        .history-title-row p {
          color: #aebed0;
          font-size: 15px;
        }

        .history-toolbar {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 22px;
          flex-wrap: wrap;
        }

        .history-search {
          flex: 1;
          min-width: 220px;
          height: 48px;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 15px;
          background: #111e30;
          border: 1px solid #293e55;
          border-radius: 9px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .history-search:focus-within {
          border-color: #55bce9;
          box-shadow: 0 0 0 3px rgba(85, 188, 233, 0.1);
        }

        .search-icon {
          font-size: 25px;
          color: #75bdf0;
          line-height: 1;
        }

        .history-search input {
          width: 100%;
          border: none;
          outline: none;
          background: transparent;
          color: #e8eff6;
          font-size: 15px;
        }

        .history-search input::placeholder {
          color: #8295aa;
        }

        .history-toolbar select,
        .history-toolbar input[type="date"] {
          height: 48px;
          padding: 0 13px;
          background: #111e30;
          border: 1px solid #293e55;
          border-radius: 9px;
          color: #e8eff6;
          font-size: 15px;
          outline: none;
          min-width: 145px;
        }

        .history-toolbar select:focus,
        .history-toolbar input[type="date"]:focus {
          border-color: #55bce9;
        }

        .history-toolbar input[type="date"]::-webkit-calendar-picker-indicator {
          cursor: pointer;
          filter: invert(0.8);
        }

        .clear-filters {
          height: 46px;
          padding: 0 17px;
          border: 1px solid #38536f;
          border-radius: 9px;
          color: #b8dfff;
          background: transparent;
          font-size: 14px;
          font-weight: 650;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .clear-filters:hover {
          background: rgba(117, 189, 240, 0.1);
          border-color: #75bdf0;
        }

        .history-table-wrap {
          width: 100%;
          overflow-x: auto;
          border-top: 1px solid #293e55;
          border-bottom: 1px solid #293e55;
        }

        .history-table {
          width: 100%;
          min-width: 700px;
          border-collapse: collapse;
          text-align: left;
        }

        .history-table thead {
          background: rgba(23, 40, 61, 0.7);
        }

        .history-table th {
          padding: 19px 18px;
          color: #a9bfd4;
          font-size: 14px;
          font-weight: 750;
          letter-spacing: 0.7px;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .history-table td {
          padding: 20px 18px;
          border-top: 1px solid rgba(41, 62, 85, 0.65);
          color: #dce7f2;
          font-size: 16px;
          font-weight: 450;
          white-space: nowrap;
        }

        .history-table tbody tr {
          transition: background 0.2s ease;
        }

        .history-table tbody tr:hover {
          background: rgba(85, 188, 233, 0.055);
        }

        .history-table .record-id {
          color: #91c9f2;
          font-size: 14px;
          font-weight: 650;
        }

        .history-table .faculty-name {
          color: #f0f5fa;
          font-weight: 650;
        }

        .history-status {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 7px 13px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 750;
          white-space: nowrap;
        }

        .status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: currentColor;
        }

        .history-empty-state {
          padding: 65px 20px;
          text-align: center;
          white-space: normal;
        }

        .empty-symbol {
          display: block;
          color: #75bdf0;
          font-size: 38px;
          margin-bottom: 12px;
        }

        .history-empty-state strong {
          display: block;
          color: #e8eff6;
          font-size: 19px;
          margin-bottom: 9px;
        }

        .history-empty-state p {
          color: #aebed0;
          font-size: 15px;
          line-height: 1.6;
        }

        .history-footer {
          margin-top: 30px;
          padding-top: 18px;
          border-top: 1px solid #293e55;
          color: #8295aa;
          font-size: 13px;
          text-align: center;
        }

        @keyframes historyFadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 850px) {
          .history-header {
            margin-bottom: 30px;
          }

          .history-toolbar {
            gap: 10px;
          }

          .history-search {
            flex-basis: 100%;
          }

          .history-toolbar select,
          .history-toolbar input[type="date"] {
            flex: 1;
          }
        }

        @media (max-width: 520px) {
          .history-header h1 {
            font-size: 28px;
          }

          .history-title-row h2 {
            font-size: 21px;
          }

          .history-toolbar select,
          .history-toolbar input[type="date"] {
            min-width: 0;
            width: 100%;
            flex-basis: 100%;
          }

          .clear-filters {
            width: 100%;
          }

          .history-table th {
            font-size: 13px;
            padding: 16px 14px;
          }

          .history-table td {
            font-size: 15px;
            padding: 18px 14px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .history-section {
            animation: none;
          }

          .history-table tbody tr,
          .clear-filters,
          .history-search {
            transition: none;
          }
        }
      `}</style>
    </main>
  );
}

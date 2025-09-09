// app/employeeview/timeoff/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";

/** ===== Types (match your Requests page) ===== */
type RequestStatus = "pending" | "approved" | "declined";
type HrRequest = {
  id: string;
  type: "Leave" | "Shift Change" | "Expense";
  employeeId: string;
  employeeName: string;
  submittedAt: string;
  dateRange?: { start: string; end: string };
  amount?: number;
  notes?: string;
  status: RequestStatus;
  processedAt?: string;
  processedBy?: string;
  declineReason?: string;
};

/** ===== LocalStorage keys ===== */
const REQUESTS_KEY = "maplehr_requests";

/** ===== Helpers ===== */
const uid = () =>
  globalThis.crypto?.randomUUID?.() ?? `id_${Math.random().toString(36).slice(2)}`;
const todayISO = () => new Date().toISOString().slice(0, 10);

function loadRequests(): HrRequest[] {
  try {
    const raw = localStorage.getItem(REQUESTS_KEY);
    return raw ? (JSON.parse(raw) as HrRequest[]) : [];
  } catch {
    return [];
  }
}
function saveRequests(reqs: HrRequest[]) {
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(reqs));
}
function isWeekend(d: Date) {
  const n = d.getDay();
  return n === 0 || n === 6;
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
/** Count days inclusive; optionally skip weekends */
function workingDaysInclusive(startISO: string, endISO: string, excludeWeekends: boolean) {
  const s = new Date(startISO);
  const e = new Date(endISO);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return 0;
  if (s > e) return 0;
  let count = 0;
  for (let d = new Date(s); d <= e; d = addDays(d, 1)) {
    if (excludeWeekends ? !isWeekend(d) : true) count++;
  }
  return count;
}

/** ===== Page ===== */
export default function TimeOffRequestPage() {
  // Pretend logged-in user (adjust defaults as needed)
  const [employeeName, setEmployeeName] = useState("Harry Styles");
  const [employeeId, setEmployeeId] = useState("100000005");

  // Form state
  const [leaveType, setLeaveType] = useState<
    | "Vacation"
    | "Sick"
    | "Personal"
    | "Unpaid"
    | "Bereavement"
    | "Jury Duty"
    | "Parental"
    | "Other"
  >("Vacation");
  const [startDate, setStartDate] = useState(todayISO());
  const [endDate, setEndDate] = useState(todayISO());
  const [halfStart, setHalfStart] = useState(false);
  const [halfEnd, setHalfEnd] = useState(false);
  const [excludeWeekends, setExcludeWeekends] = useState(true);
  const [notes, setNotes] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  // My leave submissions (read from the shared requests bucket)
  const [myLeaves, setMyLeaves] = useState<HrRequest[]>([]);

  // Load my leave requests
  useEffect(() => {
    const all = loadRequests();
    setMyLeaves(all.filter((r) => r.type === "Leave" && r.employeeId === employeeId));
  }, [employeeId]);

  // Compute total requested days
  const baseDays = useMemo(
    () => workingDaysInclusive(startDate, endDate, excludeWeekends),
    [startDate, endDate, excludeWeekends]
  );

  const totalDays = useMemo(() => {
    if (!baseDays) return 0;
    const sameDay = startDate === endDate;
    if (sameDay) {
      if (halfStart && halfEnd) return 1; // both halves on the same day still count as a full day
      if (halfStart || halfEnd) return 0.5;
      return 1;
    }
    let t = baseDays;
    if (halfStart) t -= 0.5;
    if (halfEnd) t -= 0.5;
    return Math.max(t, 0);
  }, [baseDays, halfStart, halfEnd, startDate, endDate]);

  function validate(): string | null {
    if (!employeeName.trim()) return "Employee name is required.";
    if (!employeeId.trim()) return "Employee ID is required.";
    if (!startDate) return "Start date is required.";
    if (!endDate) return "End date is required.";
    const s = new Date(startDate);
    const e = new Date(endDate);
    if (s > e) return "Start date cannot be after end date.";
    if (totalDays <= 0) return "Requested time must be at least a half day.";
    return null;
  }

  function onSubmit() {
    const v = validate();
    if (v) {
      setNotice(v);
      setTimeout(() => setNotice(null), 3000);
      return;
    }

    const all = loadRequests();
    const summary =
      `${leaveType} • ${totalDays} ${totalDays === 1 ? "day" : "days"}` +
      (notes.trim() ? ` — ${notes.trim()}` : "");

    const req: HrRequest = {
      id: uid(),
      type: "Leave",
      employeeId,
      employeeName,
      submittedAt: new Date().toISOString(),
      dateRange: { start: startDate, end: endDate },
      // amount is not used for Leave; keep undefined
      notes: summary,
      status: "pending",
    };

    const next = [req, ...all];
    saveRequests(next);

    // Update my list
    setMyLeaves((prev) => [req, ...prev]);

    // Reset minimal parts of the form
    setLeaveType("Vacation");
    setStartDate(todayISO());
    setEndDate(todayISO());
    setHalfStart(false);
    setHalfEnd(false);
    setNotes("");
    setNotice("Time off request submitted (local only).");
    setTimeout(() => setNotice(null), 2500);
  }

  function fmtDate(iso?: string) {
    if (!iso) return "—";
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString();
  }

  return (
    <main className="mx-auto max-w-6xl p-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">Request Time Off</h1>
        <div className="text-sm text-gray-600">
          Frontend demo — saved in your browser
        </div>
      </header>

      {notice && (
        <div className="mb-4 rounded border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
          {notice}
        </div>
      )}

      {/* ===== Employee & request form ===== */}
      <section className="rounded-lg border bg-white p-4">
        {/* Employee info */}
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Employee Name</label>
            <input
              className="w-full rounded border p-2"
              value={employeeName}
              onChange={(e) => setEmployeeName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Employee ID</label>
            <input
              className="w-full rounded border p-2"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              placeholder="e.g., 100000005"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Leave Type</label>
            <select
              className="w-full rounded border p-2"
              value={leaveType}
              onChange={(e) =>
                setLeaveType(
                  e.target.value as typeof leaveType
                )
              }
            >
              <option>Vacation</option>
              <option>Sick</option>
              <option>Personal</option>
              <option>Unpaid</option>
              <option>Bereavement</option>
              <option>Jury Duty</option>
              <option>Parental</option>
              <option>Other</option>
            </select>
          </div>
        </div>

        {/* Dates */}
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Start Date</label>
            <input
              type="date"
              className="w-full rounded border p-2"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <label className="mt-2 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={halfStart}
                onChange={(e) => setHalfStart(e.target.checked)}
              />
              Half day (start)
            </label>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">End Date</label>
            <input
              type="date"
              className="w-full rounded border p-2"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            <label className="mt-2 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={halfEnd}
                onChange={(e) => setHalfEnd(e.target.checked)}
              />
              Half day (end)
            </label>
          </div>
        </div>

        <div className="mt-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={excludeWeekends}
              onChange={(e) => setExcludeWeekends(e.target.checked)}
            />
            Exclude weekends
          </label>
        </div>

        {/* Notes */}
        <div className="mt-4">
          <label className="mb-1 block text-sm font-medium">Notes (optional)</label>
          <textarea
            className="w-full rounded border p-2"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any extra details for your manager/HR"
          />
        </div>

        {/* Summary + Submit */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="text-sm text-gray-700">
            <span className="font-medium">{leaveType}</span> • {fmtDate(startDate)} → {fmtDate(endDate)} •{" "}
            <span className="font-semibold text-green-700">
              {totalDays} {totalDays === 1 ? "day" : "days"}
            </span>
            {halfStart || halfEnd ? (
              <span className="text-gray-600"> (half-day {halfStart ? "start" : ""}{halfStart && halfEnd ? " & " : ""}{halfEnd ? "end" : ""})</span>
            ) : null}
            {excludeWeekends ? <span className="text-gray-500"> • weekends excluded</span> : null}
          </div>

          <button
            className="ml-auto rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
            onClick={onSubmit}
          >
            Submit request
          </button>
          <span className="text-xs text-gray-600">(Saved locally, visible to Admin in Requests)</span>
        </div>
      </section>

      {/* ===== My Time Off Requests ===== */}
      <section className="mt-8 rounded-lg border bg-white">
        <div className="border-b p-3 text-sm text-gray-600">My Time Off Requests</div>
        {myLeaves.length === 0 ? (
          <div className="p-6 text-gray-600">You haven’t submitted any time off requests yet.</div>
        ) : (
          <ul className="divide-y">
            {myLeaves.map((r) => (
              <li key={r.id} className="p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="min-w-[180px]">
                    <div className="text-sm text-gray-500">Submitted</div>
                    <div className="font-medium">
                      {new Date(r.submittedAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="min-w-[240px]">
                    <div className="text-sm text-gray-500">Dates</div>
                    <div className="font-medium">
                      {fmtDate(r.dateRange?.start)} → {fmtDate(r.dateRange?.end)}
                    </div>
                  </div>
                  <div className="min-w-[240px]">
                    <div className="text-sm text-gray-500">Summary</div>
                    <div className="font-medium">{r.notes ?? "—"}</div>
                  </div>
                  <span
                    className={`ml-auto rounded-full px-2 py-1 text-xs ${
                      r.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : r.status === "approved"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {r.status}
                  </span>
                </div>
                {r.processedAt && (
                  <div className="mt-2 text-sm text-gray-600">
                    Processed {new Date(r.processedAt).toLocaleString()} by {r.processedBy ?? "—"}
                    {r.declineReason ? ` • Reason: ${r.declineReason}` : ""}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

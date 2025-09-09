// app/admin/requests/page.tsx
"use client";

import React, { useEffect, useState } from "react";

type Status = "pending" | "approved" | "declined";
type Req = {
  id: string;
  type: "Leave" | "Shift Change" | "Expense";
  employeeId: string;
  employeeName: string;
  submittedAt: string;
  notes?: string;
  status: Status;
  declineReason?: string;
};

const STORAGE_KEY = "maplehr_requests";

function load(): Req[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Req[]) : [];
  } catch {
    return [];
  }
}
function save(data: Req[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
function seedIfEmpty() {
  const existing = load();
  if (existing.length) return existing;
  const demo: Req[] = [
    {
      id: crypto.randomUUID(),
      type: "Leave",
      employeeId: "000915041",
      employeeName: "Abel Fekadu",
      submittedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      notes: "PTO for family trip",
      status: "pending",
    },
    {
      id: crypto.randomUUID(),
      type: "Shift Change",
      employeeId: "000394998",
      employeeName: "Hunter Tapping",
      submittedAt: new Date(Date.now() - 86400000).toISOString(),
      notes: "Swap evening shift",
      status: "pending",
    },
    {
      id: crypto.randomUUID(),
      type: "Expense",
      employeeId: "000957380",
      employeeName: "Naya Bektenova",
      submittedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
      notes: "Taxi to conference",
      status: "pending",
    },
  ];
  save(demo);
  return demo;
}

export default function Page() {
  const [requests, setRequests] = useState<Req[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setRequests(seedIfEmpty());
  }, []);

  function updateOne(next: Req) {
    setRequests((prev) => {
      const updated = prev.map((r) => (r.id === next.id ? next : r));
      save(updated);
      return updated;
    });
  }
  function approve(r: Req) {
    if (r.status !== "pending") { setNotice("That request is already processed."); return; }
    updateOne({ ...r, status: "approved" });
    setNotice("Request approved.");
  }
  function decline(r: Req) {
    if (r.status !== "pending") { setNotice("That request is already processed."); return; }
    const reason = window.prompt("Optional: add a decline reason", "") || undefined;
    updateOne({ ...r, status: "declined", declineReason: reason });
    setNotice("Request declined.");
  }

  const pending = requests.filter((r) => r.status === "pending");

  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="mb-4 text-3xl font-semibold">Requests</h1>
      {notice && <div className="mb-4 rounded border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">{notice}</div>}

      {pending.length === 0 ? (
        <div className="rounded border p-6 text-center text-gray-600">No pending requests.</div>
      ) : (
        <ul className="grid gap-3">
          {pending.map((r) => (
            <li key={r.id} className="rounded-lg border p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-gray-500">{r.type} • #{r.id.slice(0, 8)}</p>
                  <h3 className="text-lg font-medium">
                    {r.employeeName} <span className="text-gray-500">({r.employeeId})</span>
                  </h3>
                  <p className="text-sm text-gray-600">Submitted: {new Date(r.submittedAt).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="rounded bg-gray-100 px-3 py-2 hover:bg-gray-200"
                    onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                  >
                    {expandedId === r.id ? "Hide details" : "View details"}
                  </button>
                  <button className="rounded bg-green-600 px-3 py-2 text-white" onClick={() => approve(r)}>Approve</button>
                  <button className="rounded bg-red-600 px-3 py-2 text-white" onClick={() => decline(r)}>Decline</button>
                </div>
              </div>

              {expandedId === r.id && (
                <div className="mt-3 rounded border p-3 text-sm text-gray-700">
                  {r.notes ? <p><span className="font-medium">Notes:</span> {r.notes}</p> : <p>No additional details.</p>}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

// app/employeeview/expenses/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";

/** ================= Category (single source of truth) ================= */
const CATEGORIES = [
  "Travel",
  "Meals",
  "Lodging",
  "Office Supplies",
  "Training",
  "Mileage",
  "Other",
] as const;

type Category = typeof CATEGORIES[number];

/** ================= Local, unique types (avoid collisions) ================= */
type ExpenseLine = {
  id: string;
  date: string;            // YYYY-MM-DD
  category: Category;      
  merchant?: string;
  description?: string;
  amount: number;          // CAD
  mileageKm?: number;      // for Mileage
  mileageRate?: number;    // for Mileage (CAD/km)
  receiptName?: string;
  receiptDataUrl?: string; // data URL demo
};

type ClaimStatus = "pending" | "approved" | "declined";

type ExpenseClaim = {
  id: string;
  employeeId: string;
  employeeName: string;
  title: string;
  submittedAt: string;
  status: ClaimStatus;
  total: number;
  items: ExpenseLine[];
};

type HrRequest = {
  id: string;
  type: "Leave" | "Shift Change" | "Expense";
  employeeId: string;
  employeeName: string;
  submittedAt: string;
  dateRange?: { start: string; end: string };
  amount?: number;
  notes?: string;
  status: "pending" | "approved" | "declined";
};

/** ================= Storage Keys ================= */
const CLAIMS_KEY = "maplehr_expense_claims_v1";
const REQUESTS_KEY = "maplehr_requests";

/** ================= Helpers ================= */
const uid = () =>
  globalThis.crypto?.randomUUID?.() ?? `id_${Math.random().toString(36).slice(2)}`;
const fmtMoney = (n: number) =>
  n.toLocaleString(undefined, { style: "currency", currency: "CAD", maximumFractionDigits: 2 });
const todayISO = () => new Date().toISOString().slice(0, 10);

function saveClaims(list: ExpenseClaim[]) {
  localStorage.setItem(CLAIMS_KEY, JSON.stringify(list));
}
function loadClaims(): ExpenseClaim[] {
  try {
    const raw = localStorage.getItem(CLAIMS_KEY);
    const arr = raw ? (JSON.parse(raw) as ExpenseClaim[]) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
function loadRequests(): HrRequest[] {
  try {
    const raw = localStorage.getItem(REQUESTS_KEY);
    return raw ? (JSON.parse(raw) as HrRequest[]) : [];
  } catch {
    return [];
  }
}
function saveRequests(list: HrRequest[]) {
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(list));
}
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("File read error"));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

// tiny helper to make intent clear to TS
const isMileage = (c: Category | undefined): c is "Mileage" => c === "Mileage";

/** ================= Page ================= */
export default function EmployeeExpensePage() {
  // Pretend "current user"
  const [employeeId, setEmployeeId] = useState("100000005");
  const [employeeName, setEmployeeName] = useState("Harry Styles");

  // New claim
  const [title, setTitle] = useState("Business travel expenses");
  const [items, setItems] = useState<ExpenseLine[]>([
    {
      id: uid(),
      date: todayISO(),
      category: "Travel",
      merchant: "",
      description: "",
      amount: 0,
    },
  ]);

  const [notice, setNotice] = useState<string | null>(null);

  // Claim history
  const [claims, setClaims] = useState<ExpenseClaim[]>([]);
  useEffect(() => setClaims(loadClaims()), []);

  const total = useMemo(
    () => items.reduce((sum, it) => sum + (isFinite(it.amount) ? it.amount : 0), 0),
    [items]
  );

  /** ====== Handlers ====== */
  function addLine() {
    setItems((prev) => [
      ...prev,
      {
        id: uid(),
        date: todayISO(),
        category: "Other",
        merchant: "",
        description: "",
        amount: 0,
      },
    ]);
  }

  function removeLine(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function updateLine(id: string, patch: Partial<ExpenseLine>) {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;

        // Switching INTO Mileage: seed defaults and compute amount
        if (isMileage(patch.category)) {
          const km = i.mileageKm ?? 0;
          const rate = i.mileageRate ?? 0.68; // demo rate
          const amount = Number((km * rate).toFixed(2));
          return { ...i, ...patch, mileageKm: km, mileageRate: rate, amount };
        }

        // Leaving Mileage → strip mileage fields
        // (Use type assertion so TS doesn't pick up any stray, narrower unions elsewhere)
        if (patch.category && (i.category as Category) === "Mileage" && !isMileage(patch.category)) {
          const next = { ...i, ...patch };
          delete (next as any).mileageKm;
          delete (next as any).mileageRate;
          return next;
        }

        const next = { ...i, ...patch };

        // Keep amount in sync for Mileage lines
        if ((("mileageKm" in patch) || ("mileageRate" in patch)) && isMileage(next.category)) {
          const km = Number(next.mileageKm ?? 0);
          const rate = Number(next.mileageRate ?? 0);
          next.amount = Number((km * rate).toFixed(2));
        }

        return next;
      })
    );
  }

  async function onReceiptChange(lineId: string, file?: File) {
    if (!file) {
      updateLine(lineId, { receiptDataUrl: undefined, receiptName: undefined });
      return;
    }
    const dataUrl = await fileToDataUrl(file);
    updateLine(lineId, { receiptDataUrl: dataUrl, receiptName: file.name });
  }

  function resetForm() {
    setTitle("Business travel expenses");
    setItems([
      { id: uid(), date: todayISO(), category: "Travel", merchant: "", description: "", amount: 0 },
    ]);
  }

  function validate(): string[] {
    const errs: string[] = [];
    if (!employeeName.trim()) errs.push("Employee name is required.");
    if (!employeeId.trim()) errs.push("Employee ID is required.");
    if (!title.trim()) errs.push("Claim title is required.");
    if (items.length === 0) errs.push("Add at least one expense line.");

    items.forEach((i, idx) => {
      if (!i.date) errs.push(`Line ${idx + 1}: Date is required.`);
      if (!i.category) errs.push(`Line ${idx + 1}: Category is required.`);
      if (!isMileage(i.category) && !(i.amount > 0)) errs.push(`Line ${idx + 1}: Amount must be > 0.`);
      if (isMileage(i.category)) {
        const km = Number(i.mileageKm ?? 0);
        const rate = Number(i.mileageRate ?? 0);
        if (!(km > 0)) errs.push(`Line ${idx + 1}: Mileage KM must be > 0.`);
        if (!(rate > 0)) errs.push(`Line ${idx + 1}: Mileage rate must be > 0.`);
      }
    });
    return errs;
  }

  function submitClaim() {
    const errors = validate();
    if (errors.length) {
      setNotice(errors[0]);
      setTimeout(() => setNotice(null), 3000);
      return;
    }

    const claim: ExpenseClaim = {
      id: uid(),
      employeeId,
      employeeName,
      title: title.trim(),
      submittedAt: new Date().toISOString(),
      status: "pending",
      total: Number(total.toFixed(2)),
      items: items.map((i) => ({ ...i, amount: Number(i.amount.toFixed(2)) })),
    };

    // Persist claim
    setClaims((prev) => {
      const next = [claim, ...prev];
      saveClaims(next);
      return next;
    });

    // Also create a matching "Expense" request for the Admin Requests page
    const requests = loadRequests();
    const req: HrRequest = {
      id: uid(),
      type: "Expense",
      employeeId,
      employeeName,
      submittedAt: claim.submittedAt,
      amount: claim.total,
      notes: claim.title,
      status: "pending",
    };
    saveRequests([req, ...requests]);

    resetForm();
    setNotice("Expense claim submitted (local only).");
    setTimeout(() => setNotice(null), 3000);
  }

  /** ================= Render ================= */
  return (
    <main className="mx-auto max-w-6xl p-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">Submit Expense Claim</h1>
        <button className="rounded border px-3 py-2 text-sm hover:bg-gray-50" onClick={resetForm}>
          Reset form
        </button>
      </header>

      {notice && (
        <div className="mb-4 rounded border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
          {notice}
        </div>
      )}

      {/* ===== Employee info & Claim meta ===== */}
      <section className="rounded-lg border bg-white p-4 mb-6">
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
            <label className="mb-1 block text-sm font-medium">Claim Title</label>
            <input
              className="w-full rounded border p-2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Purpose (e.g., Trip to Vancouver)"
            />
          </div>
        </div>
      </section>

      {/* ===== Line items ===== */}
      <section className="rounded-lg border bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-medium">Expense Lines</h2>
          <button
            className="rounded bg-green-600 px-3 py-2 text-white hover:bg-green-700"
            onClick={addLine}
          >
            + Add line
          </button>
        </div>

        {items.length === 0 ? (
          <div className="rounded border p-4 text-gray-600">No lines yet. Add your first expense.</div>
        ) : (
          <ul className="grid gap-3">
            {items.map((it, idx) => (
              <li key={it.id} className="rounded-md border p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-sm text-gray-600">Line {idx + 1}</div>
                  <button
                    className="rounded border px-2 py-1 text-xs hover:bg-gray-50"
                    onClick={() => removeLine(it.id)}
                  >
                    Remove
                  </button>
                </div>

                <div className="grid gap-3 md:grid-cols-6">
                  <div className="md:col-span-1">
                    <label className="mb-1 block text-sm font-medium">Date</label>
                    <input
                      type="date"
                      className="w-full rounded border p-2"
                      value={it.date}
                      onChange={(e) => updateLine(it.id, { date: e.target.value })}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium">Category</label>
                    <select
                      className="w-full rounded border p-2"
                      value={it.category}
                      onChange={(e) => updateLine(it.id, { category: e.target.value as Category })}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-3">
                    <label className="mb-1 block text-sm font-medium">Merchant (optional)</label>
                    <input
                      className="w-full rounded border p-2"
                      value={it.merchant ?? ""}
                      onChange={(e) => updateLine(it.id, { merchant: e.target.value })}
                      placeholder="e.g., WestJet"
                    />
                  </div>

                  {/* Non-mileage amount */}
                  {!isMileage(it.category) ? (
                    <div className="md:col-span-2">
                      <label className="mb-1 block text-sm font-medium">Amount (CAD)</label>
                      <input
                        className="w-full rounded border p-2"
                        inputMode="decimal"
                        value={Number.isFinite(it.amount) ? String(it.amount) : "0"}
                        onChange={(e) =>
                          updateLine(it.id, {
                            amount: Number(e.target.value.replace(/[^0-9.]/g, "")) || 0,
                          })
                        }
                        placeholder="0.00"
                      />
                    </div>
                  ) : (
                    <>
                      <div className="md:col-span-2">
                        <label className="mb-1 block text-sm font-medium">Kilometres</label>
                        <input
                          className="w-full rounded border p-2"
                          inputMode="decimal"
                          value={String(it.mileageKm ?? 0)}
                          onChange={(e) =>
                            updateLine(it.id, {
                              mileageKm: Number(e.target.value.replace(/[^0-9.]/g, "")) || 0,
                            })
                          }
                          placeholder="0"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="mb-1 block text-sm font-medium">Rate (CAD/km)</label>
                        <input
                          className="w-full rounded border p-2"
                          inputMode="decimal"
                          value={String(it.mileageRate ?? 0.68)}
                          onChange={(e) =>
                            updateLine(it.id, {
                              mileageRate: Number(e.target.value.replace(/[^0-9.]/g, "")) || 0,
                            })
                          }
                          placeholder="0.68"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="mb-1 block text-sm font-medium">Amount</label>
                        <div className="w-full rounded border p-2 bg-gray-50">
                          {fmtMoney(it.amount || 0)}
                        </div>
                      </div>
                    </>
                  )}

                  <div className="md:col-span-6">
                    <label className="mb-1 block text-sm font-medium">Description (optional)</label>
                    <input
                      className="w-full rounded border p-2"
                      value={it.description ?? ""}
                      onChange={(e) => updateLine(it.id, { description: e.target.value })}
                      placeholder="Short description (e.g., Taxi from YYC to hotel)"
                    />
                  </div>

                  <div className="md:col-span-6">
                    <label className="mb-1 block text-sm font-medium">Receipt (image/PDF)</label>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        await onReceiptChange(it.id, file);
                        e.currentTarget.value = ""; // allow same-file reselect
                      }}
                    />
                    {it.receiptName && (
                      <div className="mt-2 text-sm text-gray-700">
                        Attached: <span className="font-medium">{it.receiptName}</span>
                      </div>
                    )}
                    {it.receiptDataUrl && it.receiptDataUrl.startsWith("data:image/") && (
                      <img
                        src={it.receiptDataUrl}
                        alt="Receipt preview"
                        className="mt-2 h-32 w-auto rounded border object-contain"
                      />
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ===== Submit bar ===== */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="text-lg">
          Total: <span className="font-semibold text-green-700">{fmtMoney(total)}</span>
        </div>
        <button
          className="ml-auto rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
          onClick={submitClaim}
        >
          Submit claim
        </button>
        <span className="text-xs text-gray-600">(Frontend demo — saved to your browser)</span>
      </div>

      {/* ===== My Claims (history) ===== */}
      <section className="mt-8 rounded-lg border bg-white">
        <div className="border-b p-3 text-sm text-gray-600">My Claims</div>
        {claims.length === 0 ? (
          <div className="p-6 text-gray-600">No claims submitted yet.</div>
        ) : (
          <ul className="divide-y">
            {claims.map((c) => (
              <li key={c.id} className="p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="min-w-[200px]">
                    <div className="text-sm text-gray-500">Submitted</div>
                    <div className="font-medium">{new Date(c.submittedAt).toLocaleString()}</div>
                  </div>
                  <div className="min-w-[220px]">
                    <div className="text-sm text-gray-500">Title</div>
                    <div className="font-medium">{c.title}</div>
                  </div>
                  <div className="min-w-[140px]">
                    <div className="text-sm text-gray-500">Total</div>
                    <div className="font-semibold">{fmtMoney(c.total)}</div>
                  </div>
                  <span
                    className={`ml-auto rounded-full px-2 py-1 text-xs ${
                      c.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : c.status === "approved"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {c.status}
                  </span>
                </div>

                {/* Simple item preview */}
                <div className="mt-3 grid gap-2 md:grid-cols-2 text-sm text-gray-700">
                  {c.items.map((it) => (
                    <div key={it.id} className="rounded border p-2">
                      <div className="flex justify-between">
                        <span>{it.category}</span>
                        <span className="font-medium">{fmtMoney(it.amount)}</span>
                      </div>
                      <div className="text-gray-600">
                        {it.date}
                        {it.merchant ? ` • ${it.merchant}` : ""}
                        {it.description ? ` • ${it.description}` : ""}
                        {isMileage(it.category) && ` • ${it.mileageKm ?? 0} km @ ${it.mileageRate ?? 0}/km`}
                      </div>
                    </div>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

// app/employee/pay/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";

/** ========= Types ========= */
type Deductions = {
  cpp: number;
  ei: number;
  federalTax: number;
  provincialTax?: number;
  other?: number;
};

type Paycheque = {
  id: string;
  payDate: string;         // ISO date
  periodStart: string;     // ISO date
  periodEnd: string;       // ISO date
  hours: number;
  rate: number;            // hourly
  gross: number;
  net: number;
  deductions: Deductions;
  notes?: string;
};

type DirectDeposit = {
  holderName: string;
  accountType: "Chequing" | "Savings";
  institutionNumber: string; // 3 digits (Canada)
  transitNumber: string;     // 5 digits (Canada)
  accountNumber: string;     // 7–12 digits
  bankName?: string;
  updatedAt?: string;        // ISO date
};

/** ========= Storage Keys ========= */
const PAY_STORAGE = "maplehr_paycheques_v1";
const DD_STORAGE = "maplehr_direct_deposit_v1";

/** ========= Helpers ========= */
const uid = () => globalThis.crypto?.randomUUID?.() ?? `id_${Math.random().toString(36).slice(2)}`;
const fmtMoney = (n: number) =>
  n.toLocaleString(undefined, { style: "currency", currency: "CAD", maximumFractionDigits: 2 });
const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString();
};
const maskAcct = (acct: string) =>
  acct.length <= 4 ? "••••" : `${"•".repeat(Math.max(0, acct.length - 4))}${acct.slice(-4)}`;

function savePay(data: Paycheque[]) {
  localStorage.setItem(PAY_STORAGE, JSON.stringify(data));
}
function loadPay(): Paycheque[] {
  try {
    const raw = localStorage.getItem(PAY_STORAGE);
    return raw ? (JSON.parse(raw) as Paycheque[]) : [];
  } catch {
    return [];
  }
}
function saveDeposit(dd: DirectDeposit) {
  localStorage.setItem(DD_STORAGE, JSON.stringify(dd));
}
function loadDeposit(): DirectDeposit | null {
  try {
    const raw = localStorage.getItem(DD_STORAGE);
    return raw ? (JSON.parse(raw) as DirectDeposit) : null;
  } catch {
    return null;
  }
}

/** Seed a small deterministic demo history */
function seedPayDemo(): Paycheque[] {
  const base: Paycheque[] = [
    {
      id: uid(),
      payDate: "2025-09-05",
      periodStart: "2025-08-23",
      periodEnd: "2025-09-05",
      hours: 80,
      rate: 32.5,
      gross: 2600,
      deductions: { cpp: 136.5, ei: 41.6, federalTax: 355.0, provincialTax: 197.3 },
      net: 2600 - (136.5 + 41.6 + 355 + 197.3),
      notes: "Bi-weekly payroll",
    },
    {
      id: uid(),
      payDate: "2025-08-22",
      periodStart: "2025-08-09",
      periodEnd: "2025-08-22",
      hours: 80,
      rate: 32.5,
      gross: 2600,
      deductions: { cpp: 136.5, ei: 41.6, federalTax: 355.0, provincialTax: 197.3 },
      net: 2600 - (136.5 + 41.6 + 355 + 197.3),
      notes: "Bi-weekly payroll",
    },
    {
      id: uid(),
      payDate: "2025-08-08",
      periodStart: "2025-07-26",
      periodEnd: "2025-08-08",
      hours: 80,
      rate: 32.5,
      gross: 2600,
      deductions: { cpp: 136.5, ei: 41.6, federalTax: 355.0, provincialTax: 197.3 },
      net: 2600 - (136.5 + 41.6 + 355 + 197.3),
      notes: "Bi-weekly payroll",
    },
  ];
  savePay(base);
  return base;
}

/** ========= Validation (Canada-style) ========= */
function validateDeposit(dd: DirectDeposit) {
  const errors: Partial<Record<keyof DirectDeposit, string>> = {};
  if (!dd.holderName.trim()) errors.holderName = "Account holder name is required.";
  if (!/^\d{3}$/.test(dd.institutionNumber)) errors.institutionNumber = "Institution # must be 3 digits.";
  if (!/^\d{5}$/.test(dd.transitNumber)) errors.transitNumber = "Transit # must be 5 digits.";
  if (!/^\d{7,12}$/.test(dd.accountNumber)) errors.accountNumber = "Account # must be 7–12 digits.";
  return errors;
}

/** ========= Component ========= */
export default function EmployeePayPage() {
  // Pay history
  const [pay, setPay] = useState<Paycheque[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [year, setYear] = useState<string>("all");

  // Direct deposit
  const [form, setForm] = useState<DirectDeposit>({
    holderName: "",
    accountType: "Chequing",
    institutionNumber: "",
    transitNumber: "",
    accountNumber: "",
    bankName: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof DirectDeposit, string>>>({});
  const [notice, setNotice] = useState<string | null>(null);

  // Init
  useEffect(() => {
    const existing = loadPay();
    setPay(existing.length ? existing : seedPayDemo());

    const dd = loadDeposit();
    if (dd) setForm(dd);
  }, []);

  const years = useMemo(() => {
    const set = new Set<string>();
    pay.forEach((p) => set.add(new Date(p.payDate).getFullYear().toString()));
    return Array.from(set).sort((a, b) => Number(b) - Number(a));
  }, [pay]);

  const filtered = useMemo(() => {
    if (year === "all") return pay.slice().sort((a, b) => +new Date(b.payDate) - +new Date(a.payDate));
    return pay
      .filter((p) => new Date(p.payDate).getFullYear().toString() === year)
      .slice()
      .sort((a, b) => +new Date(b.payDate) - +new Date(a.payDate));
  }, [pay, year]);

  /** Export CSV for visible rows */
  function exportCSV() {
    const rows = filtered.map((p) => ({
      payDate: p.payDate,
      periodStart: p.periodStart,
      periodEnd: p.periodEnd,
      hours: p.hours,
      rate: p.rate,
      gross: p.gross,
      cpp: p.deductions.cpp,
      ei: p.deductions.ei,
      federalTax: p.deductions.federalTax,
      provincialTax: p.deductions.provincialTax ?? 0,
      other: p.deductions.other ?? 0,
      net: p.net,
      notes: p.notes ?? "",
    }));
    const header = Object.keys(rows[0] ?? { sample: "" }).join(",");
    const csv =
      header +
      "\n" +
      rows
        .map((r) =>
          Object.values(r)
            .map((v) => `"${String(v).replace(/"/g, '""')}"`)
            .join(",")
        )
        .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `paycheques_${year === "all" ? "all" : year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /** Direct deposit save */
  function onSaveDeposit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validateDeposit(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    const next = { ...form, updatedAt: new Date().toISOString() };
    setForm(next);
    saveDeposit(next);
    setNotice("Direct deposit details updated.");
    setTimeout(() => setNotice(null), 3000);
  }

  function resetDeposit() {
    localStorage.removeItem(DD_STORAGE);
    setForm({
      holderName: "",
      accountType: "Chequing",
      institutionNumber: "",
      transitNumber: "",
      accountNumber: "",
      bankName: "",
    });
    setErrors({});
    setNotice("Direct deposit reset (local only).");
    setTimeout(() => setNotice(null), 2500);
  }

  function resetPayDemo() {
    const seeded = seedPayDemo();
    setPay(seeded);
    setNotice("Paycheque demo data reset.");
    setTimeout(() => setNotice(null), 2500);
  }

  return (
    <main className="mx-auto max-w-6xl p-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">Pay & Direct Deposit</h1>
        <div className="flex gap-2">
          <button className="rounded border px-3 py-2 text-sm hover:bg-gray-50" onClick={resetPayDemo}>
            Reset demo pay
          </button>
          <button className="rounded border px-3 py-2 text-sm hover:bg-gray-50" onClick={resetDeposit}>
            Reset deposit
          </button>
        </div>
      </header>

      {notice && (
        <div className="mb-4 rounded border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">{notice}</div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ===== Paycheque history ===== */}
        <section className="lg:col-span-2 rounded-lg border bg-white">
          <div className="flex flex-wrap items-center gap-3 border-b p-3">
            <div className="text-sm text-gray-600">Paycheque History</div>
            <div className="ml-auto flex gap-2">
              <select
                className="rounded border px-3 py-2 text-sm"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              >
                <option value="all">All years</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <button className="rounded border px-3 py-2 text-sm hover:bg-gray-50" onClick={exportCSV}>
                Export CSV
              </button>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="p-6 text-center text-gray-600">No paycheques found.</div>
          ) : (
            <ul className="divide-y">
              {filtered.map((p) => {
                const open = expanded === p.id;
                return (
                  <li key={p.id} className="p-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="min-w-[120px]">
                        <div className="text-sm text-gray-500">Pay Date</div>
                        <div className="font-medium">{fmtDate(p.payDate)}</div>
                      </div>
                      <div className="min-w-[180px]">
                        <div className="text-sm text-gray-500">Period</div>
                        <div className="font-medium">
                          {fmtDate(p.periodStart)} → {fmtDate(p.periodEnd)}
                        </div>
                      </div>
                      <div className="min-w-[120px]">
                        <div className="text-sm text-gray-500">Hours</div>
                        <div className="font-medium">{p.hours.toFixed(2)}</div>
                      </div>
                      <div className="min-w-[120px]">
                        <div className="text-sm text-gray-500">Gross</div>
                        <div className="font-medium">{fmtMoney(p.gross)}</div>
                      </div>
                      <div className="min-w-[120px]">
                        <div className="text-sm text-gray-500">Net</div>
                        <div className="font-semibold text-green-700">{fmtMoney(p.net)}</div>
                      </div>
                      <button
                        className="ml-auto rounded border px-3 py-2 text-sm hover:bg-gray-50"
                        onClick={() => setExpanded(open ? null : p.id)}
                      >
                        {open ? "Hide details" : "View details"}
                      </button>
                    </div>

                    {open && (
                      <div className="mt-3 rounded border p-3 text-sm text-gray-700">
                        <div className="grid gap-3 md:grid-cols-3">
                          <div>
                            <div className="text-gray-500">Rate</div>
                            <div className="font-medium">{fmtMoney(p.rate)}/hr</div>
                          </div>
                          <div>
                            <div className="text-gray-500">CPP</div>
                            <div className="font-medium">-{fmtMoney(p.deductions.cpp)}</div>
                          </div>
                          <div>
                            <div className="text-gray-500">EI</div>
                            <div className="font-medium">-{fmtMoney(p.deductions.ei)}</div>
                          </div>
                          <div>
                            <div className="text-gray-500">Federal Tax</div>
                            <div className="font-medium">-{fmtMoney(p.deductions.federalTax)}</div>
                          </div>
                          <div>
                            <div className="text-gray-500">Provincial Tax</div>
                            <div className="font-medium">-{fmtMoney(p.deductions.provincialTax ?? 0)}</div>
                          </div>
                          <div>
                            <div className="text-gray-500">Other</div>
                            <div className="font-medium">-{fmtMoney(p.deductions.other ?? 0)}</div>
                          </div>
                        </div>
                        {p.notes && <div className="mt-3 text-gray-600">Notes: {p.notes}</div>}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* ===== Direct deposit ===== */}
        <section className="rounded-lg border bg-white p-4">
          <h2 className="mb-3 text-xl font-semibold">Direct Deposit</h2>

          {/* Current card */}
          <div className="mb-4 rounded-md border p-3">
            <div className="text-sm text-gray-500">Current</div>
            {form.accountNumber ? (
              <div className="mt-1 text-sm">
                <div>
                  {form.holderName} — {form.accountType}
                </div>
                <div className="text-gray-700">
                  Inst #{form.institutionNumber} • Transit #{form.transitNumber} • Acct {maskAcct(form.accountNumber)}
                </div>
                {form.bankName && <div className="text-gray-700">Bank: {form.bankName}</div>}
                {form.updatedAt && (
                  <div className="text-xs text-gray-500 mt-1">Updated: {fmtDate(form.updatedAt)}</div>
                )}
              </div>
            ) : (
              <div className="mt-1 text-sm text-gray-600">No direct deposit set yet.</div>
            )}
          </div>

          {/* Form */}
          <form className="grid gap-3" onSubmit={onSaveDeposit} noValidate>
            <div>
              <label className="mb-1 block text-sm font-medium">Account Holder Name</label>
              <input
                className="w-full rounded border p-2"
                value={form.holderName}
                onChange={(e) => setForm({ ...form, holderName: e.target.value })}
                placeholder="e.g., Harry Styles"
              />
              {errors.holderName && <p className="mt-1 text-xs text-red-600">{errors.holderName}</p>}
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Account Type</label>
                <select
                  className="w-full rounded border p-2"
                  value={form.accountType}
                  onChange={(e) => setForm({ ...form, accountType: e.target.value as DirectDeposit["accountType"] })}
                >
                  <option>Chequing</option>
                  <option>Savings</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Bank Name (optional)</label>
                <input
                  className="w-full rounded border p-2"
                  value={form.bankName ?? ""}
                  onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                  placeholder="e.g., RBC, TD, Scotiabank"
                />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Institution # (3 digits)</label>
                <input
                  className="w-full rounded border p-2"
                  inputMode="numeric"
                  maxLength={3}
                  value={form.institutionNumber}
                  onChange={(e) => setForm({ ...form, institutionNumber: e.target.value.replace(/\D/g, "").slice(0, 3) })}
                  placeholder="###"
                />
                {errors.institutionNumber && (
                  <p className="mt-1 text-xs text-red-600">{errors.institutionNumber}</p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Transit # (5 digits)</label>
                <input
                  className="w-full rounded border p-2"
                  inputMode="numeric"
                  maxLength={5}
                  value={form.transitNumber}
                  onChange={(e) => setForm({ ...form, transitNumber: e.target.value.replace(/\D/g, "").slice(0, 5) })}
                  placeholder="#####"
                />
                {errors.transitNumber && <p className="mt-1 text-xs text-red-600">{errors.transitNumber}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Account # (7–12 digits)</label>
                <input
                  className="w-full rounded border p-2"
                  inputMode="numeric"
                  maxLength={12}
                  value={form.accountNumber}
                  onChange={(e) => setForm({ ...form, accountNumber: e.target.value.replace(/\D/g, "").slice(0, 12) })}
                  placeholder="###########"
                />
                {errors.accountNumber && <p className="mt-1 text-xs text-red-600">{errors.accountNumber}</p>}
              </div>
            </div>

            <div className="mt-2 flex gap-2">
              <button
                type="submit"
                className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
              >
                Save changes
              </button>
              <span className="self-center text-xs text-gray-600">(Local only — frontend demo)</span>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

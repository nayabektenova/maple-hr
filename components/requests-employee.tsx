"use client";

import * as React from "react";
import { Send, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabaseClient";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";

type RequestStatus = "pending" | "approved" | "declined";
type HrType = "Leave" | "Shift Change" | "Expense";

type HrRequestRow = {
  id: string;
  type: HrType;
  employee_id: string;
  employee_name: string;
  submitted_at: string;
  date_start: string | null;
  date_end: string | null;
  amount: number | null;
  notes: string | null;
  status: RequestStatus;
  processed_at: string | null;
  processed_by: string | null;
  decline_reason: string | null;
};

function fmt(d: string) {
  const t = new Date(d);
  return isNaN(t.getTime()) ? d : t.toLocaleString();
}

function StatusBadge({ s }: { s: RequestStatus }) {
  return <Badge variant={s === "pending" ? "secondary" : s === "approved" ? "default" : "destructive"}>{s}</Badge>;
}

export default function RequestsEmployee() {
  const [type, setType] = React.useState<HrType>("Leave");
  const [employeeId, setEmployeeId] = React.useState("");
  const [employeeName, setEmployeeName] = React.useState("");
  const [dateStart, setDateStart] = React.useState("");
  const [dateEnd, setDateEnd] = React.useState("");
  const [amount, setAmount] = React.useState<string>("");
  const [notes, setNotes] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [ok, setOk] = React.useState<string | null>(null);

  const [recent, setRecent] = React.useState<HrRequestRow[]>([]);
  const [loadingList, setLoadingList] = React.useState(false);

  const canSubmit = React.useMemo(() => {
    if (!employeeId.trim() || !employeeName.trim()) return false;
    if (type === "Expense") {
      const n = Number(amount);
      return Number.isFinite(n) && n > 0;
    } else {
      if (!dateStart) return false;
      if (type === "Leave" && !dateEnd) return false;
      return true;
    }
  }, [type, employeeId, employeeName, dateStart, dateEnd, amount]);

  function resetForm() {
    if (type === "Expense") {
      setAmount("");
    } else {
      setDateStart("");
      setDateEnd("");
    }
    setNotes("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setErr(null);
    setOk(null);

    const nowIso = new Date().toISOString();
    let dStart: string | null = null;
    let dEnd: string | null = null;
    let amt: number | null = null;

    if (type === "Expense") {
      const parsed = Number(amount);
      amt = Number.isFinite(parsed) ? parsed : null;
    } else if (type === "Shift Change") {
      dStart = dateStart || null;
      dEnd = dateStart || null;
    } else {
      dStart = dateStart || null;
      dEnd = dateEnd || null;
    }

    const payload = {
      type,
      employee_id: employeeId.trim(),
      employee_name: employeeName.trim(),
      submitted_at: nowIso,
      date_start: dStart,
      date_end: dEnd,
      amount: amt,
      notes: notes.trim() || null,
      status: "pending" as RequestStatus,
    };

    const { error } = await supabase.from("hr_requests").insert([payload]);

    if (error) {
      setErr(error.message);
    } else {
      setOk("Your request was submitted. You can track it below.");
      resetForm();
    }

    setSubmitting(false);
  }

  async function fetchRecent(listForId?: string) {
    const id = (listForId ?? employeeId).trim();
    if (!id) return;
    setLoadingList(true);
    setErr(null);

    const { data, error } = await supabase
      .from("hr_requests")
      .select(
        `id, type, employee_id, employee_name, submitted_at, date_start, date_end, amount, notes, status, processed_at, processed_by, decline_reason`
      )
      .eq("employee_id", id)
      .order("submitted_at", { ascending: false })
      .limit(20);

    if (error) {
      setErr(error.message);
      setRecent([]);
    } else {
      setRecent(data ?? []);
    }
    setLoadingList(false);
  }

  React.useEffect(() => {
    if (employeeId) fetchRecent(employeeId);
  }, []);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-8">
      <h1 className="text-xl font-semibold mb-2">Submit a Request</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Fill out the form below. Your request will be sent for approval and appear in your recent requests list.
      </p>

      {err && <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div>}
      {ok && <div className="mb-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">{ok}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              value={type}
              onChange={(e) => setType(e.target.value as HrType)}
            >
              <option value="Leave">Leave</option>
              <option value="Shift Change">Shift Change</option>
              <option value="Expense">Expense</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Employee ID</label>
            <Input placeholder="e.g., 000957380" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Employee Name</label>
            <Input
              placeholder="e.g., Naya Bektenova"
              value={employeeName}
              onChange={(e) => setEmployeeName(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {type === "Expense" ? (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Amount (CAD)</label>
                <Input
                  inputMode="decimal"
                  type="number"
                  step="0.01"
                  placeholder="e.g., 124.56"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Notes (optional)</label>
                <Textarea
                  rows={3}
                  placeholder="Short description (e.g., 'Conference taxi receipts')"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">{type === "Shift Change" ? "Date" : "Start date"}</label>
                <Input type="date" value={dateStart} onChange={(e) => setDateStart(e.target.value)} />
              </div>
              {type === "Leave" && (
                <div>
                  <label className="block text-sm font-medium mb-1">End date</label>
                  <Input type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} />
                </div>
              )}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Notes (optional)</label>
                <Textarea
                  rows={3}
                  placeholder={type === "Shift Change" ? "Who are you swapping with? Any context…" : "Reason / context…"}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={!canSubmit || submitting} className="inline-flex items-center">
            <Send className="mr-2 h-4 w-4" />
            {submitting ? "Submitting…" : "Submit request"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setType("Leave");
              setDateStart("");
              setDateEnd("");
              setAmount("");
              setNotes("");
              setErr(null);
              setOk(null);
            }}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Clear form
          </Button>
        </div>
      </form>

      <Separator className="my-8" />

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">My Recent Requests</h2>
        <div className="text-sm text-muted-foreground">
          {loadingList ? "Loading…" : employeeId ? `Employee ID: ${employeeId}` : "Enter your Employee ID to see your list"}
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-40">Type</TableHead>
            <TableHead className="w-[260px]">Submitted</TableHead>
            <TableHead>Details</TableHead>
            <TableHead className="w-28">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {recent.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                {employeeId ? "No requests yet. Submit one above." : "Enter your Employee ID and press “Refresh my requests”."
                }
              </TableCell>
            </TableRow>
          ) : (
            recent.map((r) => (
              <TableRow key={r.id} className="hover:bg-gray-50">
                <TableCell className="font-medium">{r.type}</TableCell>
                <TableCell className="text-gray-600">{fmt(r.submitted_at)}</TableCell>
                <TableCell className="text-gray-700">
                  {r.type === "Expense" && typeof r.amount === "number"
                    ? `Amount: $${r.amount.toFixed(2)}${r.notes ? ` — ${r.notes}` : ""}`
                    : r.date_start && r.date_end
                    ? r.date_start === r.date_end
                      ? `Date: ${r.date_start}${r.notes ? ` — ${r.notes}` : ""}`
                      : `Dates: ${r.date_start} → ${r.date_end}${r.notes ? ` — ${r.notes}` : ""}`
                    : r.notes ?? "—"}
                </TableCell>
                <TableCell>
                  <StatusBadge s={r.status} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <div className="mt-4">
        <Button type="button" variant="outline" onClick={() => fetchRecent()}>
          Refresh my requests
        </Button>
      </div>
    </div>
  );
}

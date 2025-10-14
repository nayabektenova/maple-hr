"use client";

import * as React from "react";
import { Send, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";


type RequestStatus = "pending" | "approved" | "declined";
type HrType = "Leave" | "Shift Change" | "Expense";

function fmt(d: string) {
  const t = new Date(d);
  return isNaN(t.getTime()) ? d : t.toLocaleString();
}

function StatusBadge({ s }: { s: RequestStatus }) {
  return (
    <Badge variant={s === "pending" ? "secondary" : s === "approved" ? "default" : "destructive"}>
      {s}
    </Badge>
  );
}

export default function RequestsEmployee() {
  
  const [type, setType] = React.useState<HrType>("Leave");
  const [employeeId, setEmployeeId] = React.useState("");
  const [employeeName, setEmployeeName] = React.useState("");

  // Dates (Leave range; Shift Change single day uses start=end)
  const [dateStart, setDateStart] = React.useState("");
  const [dateEnd, setDateEnd] = React.useState("");

  // Expense
  const [amount, setAmount] = React.useState<string>("");

  // Common
  const [notes, setNotes] = React.useState("");

  const [submitting, setSubmitting] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [ok, setOk] = React.useState<string | null>(null);

  const canSubmit = React.useMemo(() => {
    if (!employeeId.trim() || !employeeName.trim()) return false;

    if (type === "Expense") {
      const n = Number(amount);
      return Number.isFinite(n) && n > 0;
    } else {
      // Leave / Shift Change
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setErr(null);
    setOk("Form looks valid. Submission will be wired in the next step.");
 
  }

  function TypeSpecificFields({ type }: { type: HrType }) {
    if (type === "Expense") {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>
      );
    }

    // Leave or Shift Change
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            {type === "Shift Change" ? "Date" : "Start date"}
          </label>
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
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-8">
      <h1 className="text-xl font-semibold mb-2">Submit a Request</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Fill out the form below. Your request will be sent for approval and appear in your recent requests list.
      </p>

      {err && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div>
      )}
      {ok && (
        <div className="mb-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">{ok}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Type */}
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

          {/* Employee ID */}
          <div>
            <label className="block text-sm font-medium mb-1">Employee ID</label>
            <Input
              placeholder="e.g., 000957380"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
            />
          </div>

          {/* Employee Name */}
          <div>
            <label className="block text-sm font-medium mb-1">Employee Name</label>
            <Input
              placeholder="e.g., Naya Bektenova"
              value={employeeName}
              onChange={(e) => setEmployeeName(e.target.value)}
            />
          </div>
        </div>

        {/* Type-specific fields */}
        <TypeSpecificFields type={type} />

        {/* Actions */}
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
    </div>
  );
}

"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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
const [dateStart, setDateStart] = React.useState("");
const [dateEnd, setDateEnd] = React.useState("");
const [amount, setAmount] = React.useState<string>("");
const [notes, setNotes] = React.useState("");

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
function TypeSpecificFields({ type }: { type: HrType }) {
  if (type === "Expense") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Amount (CAD)</label>
          <Input inputMode="decimal" type="number" step="0.01" placeholder="e.g., 124.56"
            value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Notes (optional)</label>
          <Textarea rows={3} placeholder="Short description" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>
    );
  }
}
export default function RequestsEmployee() {
  const [type, setType] = React.useState<HrType>("Leave");
  const [employeeId, setEmployeeId] = React.useState("");
  const [employeeName, setEmployeeName] = React.useState("");

return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        <Textarea rows={3} placeholder="Reason / context…" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
    </div>
  );
}
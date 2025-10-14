"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";


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

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-8">
      {/* ... */}
      <form className="space-y-6">
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
            <Input placeholder="e.g., Naya Bektenova" value={employeeName} onChange={(e) => setEmployeeName(e.target.value)} />
          </div>
        </div>
      </form>
    </div>
  );
}
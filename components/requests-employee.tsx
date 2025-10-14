"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";

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
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-8">
      <h1 className="text-xl font-semibold mb-2">Submit a Request</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Fill out the form below. Your request will be sent for approval and appear in your recent requests list.
      </p>
    </div>
  );
}

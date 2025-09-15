"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type TimeOffType = "Vacation" | "Sick" | "Personal" | "Unpaid" | "Other";
type Status = "pending" | "approved" | "declined";

type TimeOffRequest = {
  id: string;
  submittedAt: string; // ISO
  type: TimeOffType;
  startDate: string;   // YYYY-MM-DD
  endDate: string;     // YYYY-MM-DD
  reason?: string;
  status: Status;      // will be "pending" in this FE-only demo
};

const KEY = "maplehr_time_off_requests_v1";
const uid = () => crypto?.randomUUID?.() ?? `id_${Math.random().toString(36).slice(2)}`;
const fmt = (d: string) => {
  const t = new Date(d);
  return isNaN(t.getTime()) ? d : t.toLocaleDateString();
};
const dayCount = (start: string, end: string) => {
  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T00:00:00");
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return 0;
  const ms = e.getTime() - s.getTime();
  return ms < 0 ? 0 : Math.floor(ms / 86400000) + 1; // inclusive
};

function load(): TimeOffRequest[] {
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? (JSON.parse(raw) as TimeOffRequest[]) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
function save(rows: TimeOffRequest[]) {
  localStorage.setItem(KEY, JSON.stringify(rows));
}

export default function TimeOff() {
  const [rows, setRows] = React.useState<TimeOffRequest[]>([]);
  const [type, setType] = React.useState<TimeOffType | "">("");
  const [startDate, setStartDate] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [reason, setReason] = React.useState("");
  const [notice, setNotice] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setRows(load());
  }, []);

  const list = React.useMemo(
    () => rows.slice().sort((a, b) => +new Date(b.submittedAt) - +new Date(a.submittedAt)),
    [rows]
  );

  function clearForm() {
    setType("");
    const today = new Date().toISOString().slice(0, 10);
    setStartDate(today);
    setEndDate(today);
    setReason("");
    setError(null);
  }

  function submit() {
    setError(null);
    if (!type) return setError("Please choose a time off type.");
    if (!startDate || !endDate) return setError("Please select start and end dates.");
    if (new Date(startDate) > new Date(endDate)) return setError("Start date cannot be after end date.");

    const next: TimeOffRequest = {
      id: uid(),
      submittedAt: new Date().toISOString(),
      type: type as TimeOffType,
      startDate,
      endDate,
      reason: reason.trim() || undefined,
      status: "pending",
    };

    setRows((prev) => {
      const arr = [next, ...prev];
      save(arr);
      return arr;
    });
    clearForm();
    setNotice("Time off request submitted (local only).");
    setTimeout(() => setNotice(null), 2500);
  }

  function cancel(id: string) {
    setRows((prev) => {
      const arr = prev.filter((r) => r.id !== id);
      save(arr);
      return arr;
    });
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Left: Request form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Request Time Off</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {notice && <div className="rounded border border-blue-200 bg-blue-50 p-2 text-xs text-blue-900">{notice}</div>}
          {error && <div className="rounded border border-red-200 bg-red-50 p-2 text-xs text-red-900">{error}</div>}

          <div className="grid gap-2">
            <label className="text-sm">Type</label>
            {/* pass undefined to show placeholder when value is "" */}
            <Select value={(type as string) || undefined} onValueChange={(v) => setType(v as TimeOffType)}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Vacation">Vacation</SelectItem>
                <SelectItem value="Sick">Sick</SelectItem>
                <SelectItem value="Personal">Personal</SelectItem>
                <SelectItem value="Unpaid">Unpaid</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2 md:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm">Start date</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <label className="text-sm">End date</label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            Days requested: {startDate && endDate ? dayCount(startDate, endDate) : 0}
          </div>

          <div className="grid gap-2">
            <label className="text-sm">Reason (optional)</label>
            <Textarea rows={3} placeholder="Add any details for your manager" value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>

          <Separator />

          <div className="flex gap-2">
            <Button className="bg-green-600 hover:bg-green-700" onClick={submit}>Submit</Button>
            <Button variant="outline" onClick={clearForm}>Clear</Button>
          </div>
        </CardContent>
      </Card>

      {/* Right: Submitted requests */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">My Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Submitted</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((r) => (
                <TableRow key={r.id} className="hover:bg-gray-50">
                  <TableCell className="text-gray-600">{new Date(r.submittedAt).toLocaleString()}</TableCell>
                  <TableCell>{fmt(r.startDate)} – {fmt(r.endDate)} ({dayCount(r.startDate, r.endDate)})</TableCell>
                  <TableCell>{r.type}</TableCell>
                  <TableCell>
                    <Badge variant={r.status === "pending" ? "secondary" : r.status === "approved" ? "default" : "destructive"}>
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {r.status === "pending" && (
                      <Button variant="outline" size="sm" onClick={() => cancel(r.id)}>
                        Cancel
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {list.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                    No time off requests yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

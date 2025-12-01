"use client";

import * as React from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { RefreshCw } from "lucide-react";

type ReqRow = {
  id: string;
  user_id: string;
  employee_name: string | null;
  type: "Shift Change";
  notes: string | null;
  start_date: string | null; // date of shift
  end_date: string | null;   // optional (same as start_date here)
  amount: number | null;     // unused
  status: "pending" | "approved" | "declined";
  processed_at: string | null;
  decline_reason: string | null;
  created_at: string | null;
};

const SHIFTS = [
  { v: "MORNING_07_15", label: "Morning (07:00–15:00)" },
  { v: "DAY_09_17",     label: "Day (09:00–17:00)" },
  { v: "EVENING_15_23", label: "Evening (15:00–23:00)" },
  { v: "NIGHT_23_07",   label: "Night (23:00–07:00)" },
] as const;

function fmtDate(d?: string | null) {
  if (!d) return "—";
  const t = new Date(d);
  return isNaN(t.getTime()) ? d : t.toLocaleDateString();
}

export default function ShiftSwap() {
  const [uid, setUid] = React.useState<string | null>(null);
  const [displayName, setDisplayName] = React.useState<string>("");

  // form
  const [date, setDate] = React.useState<string>("");
  const [myShift, setMyShift] = React.useState<string>("");
  const [swapWith, setSwapWith] = React.useState<string>("");
  const [swapWithShift, setSwapWithShift] = React.useState<string>("");
  const [notes, setNotes] = React.useState<string>("");

  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  // my submitted requests
  const [rows, setRows] = React.useState<ReqRow[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      setUid(user?.id ?? null);
      const name =
        (user?.user_metadata?.full_name as string) ||
        [user?.user_metadata?.first_name, user?.user_metadata?.last_name].filter(Boolean).join(" ") ||
        user?.email ||
        "Employee";
      setDisplayName(name);
    });
  }, []);

  async function fetchMine() {
    if (!uid) return;
    setLoading(true);
    setMessage(null);
    const { data, error } = await supabase
      .from("requests")
      .select("*")
      .eq("user_id", uid)
      .eq("type", "Shift Change")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(`Load failed: ${error.message}`);
      setRows([]);
    } else {
      setRows((data ?? []) as ReqRow[]);
    }
    setLoading(false);
  }

  React.useEffect(() => {
    if (uid) fetchMine();
  }, [uid]);

  async function submit() {
    if (!uid) return;
    if (!date || !myShift || !swapWith || !swapWithShift) {
      setMessage("Please fill date, your shift, coworker and coworker shift.");
      return;
    }
    setBusy(true);
    setMessage(null);

    const payload = {
      user_id: uid,
      employee_name: displayName,
      type: "Shift Change" as const,
      start_date: date,        // shift date
      end_date: date,
      notes:
        `My shift: ${labelFor(myShift)} | Swap with ${swapWith} (${labelFor(swapWithShift)}).` +
        (notes ? ` Notes: ${notes}` : ""),
      status: "pending" as const,
    };

    const { error } = await supabase.from("requests").insert([payload]);

    setBusy(false);
    if (error) {
      setMessage(`Submit failed: ${error.message}`);
      return;
    }
    setMessage("Swap request submitted.");
    // clear minimal fields but keep coworker for convenience
    setDate("");
    setMyShift("");
    setSwapWith("");
    setSwapWithShift("");
    setNotes("");
    await fetchMine();
  }

  function labelFor(v: string) {
    return SHIFTS.find((s) => s.v === v)?.label ?? v;
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Submit swap */}
      <Card className="md:col-span-1">
        <CardHeader>
          <CardTitle className="text-base">Request Shift Swap</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {message && (
            <div className="rounded border border-blue-200 bg-blue-50 p-2 text-xs text-blue-900">
              {message}
            </div>
          )}
          <div className="grid gap-2">
            <label className="text-sm">Shift date</label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div className="grid gap-2">
            <label className="text-sm">Your shift</label>
            <Select value={myShift} onValueChange={setMyShift}>
              <SelectTrigger><SelectValue placeholder="Select your shift" /></SelectTrigger>
              <SelectContent>
                {SHIFTS.map((s) => (
                  <SelectItem key={s.v} value={s.v}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <label className="text-sm">Swap with (coworker name)</label>
            <Input placeholder="e.g., Naya Bektenova" value={swapWith} onChange={(e) => setSwapWith(e.target.value)} />
          </div>

          <div className="grid gap-2">
            <label className="text-sm">Coworker shift</label>
            <Select value={swapWithShift} onValueChange={setSwapWithShift}>
              <SelectTrigger><SelectValue placeholder="Select coworker shift" /></SelectTrigger>
              <SelectContent>
                {SHIFTS.map((s) => (
                  <SelectItem key={s.v} value={s.v}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <label className="text-sm">Notes (optional)</label>
            <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any context…" />
          </div>

          <Button className="bg-green-600 hover:bg-green-700 w-full" disabled={busy || !uid} onClick={submit}>
            {busy ? "Submitting…" : "Submit Swap Request"}
          </Button>
        </CardContent>
      </Card>

      {/* My swap requests */}
      <Card className="md:col-span-2">
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="text-base">My Swap Requests</CardTitle>
          <Button variant="outline" size="sm" onClick={fetchMine}>
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-gray-600">Loading…</div>
          ) : rows.length === 0 ? (
            <div className="text-sm text-gray-600">No shift swap requests yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Your Shift</TableHead>
                  <TableHead>Swap With</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => {
                  // parse back out of notes for the table (since we stored compactly)
                  const my = SHIFTS.map(s => s.label).find(lbl => r.notes?.includes(`My shift: ${lbl}`)) ?? "—";
                  const coworker = (r.notes?.match(/Swap with ([^(]+)/)?.[1] ?? "—").trim();
                  return (
                    <TableRow key={r.id}>
                      <TableCell>{fmtDate(r.start_date)}</TableCell>
                      <TableCell>{my}</TableCell>
                      <TableCell>{coworker}</TableCell>
                      <TableCell>
                        {r.status === "pending" && <Badge variant="secondary">pending</Badge>}
                        {r.status === "approved" && <Badge className="bg-green-600 hover:bg-green-600">approved</Badge>}
                        {r.status === "declined" && <Badge className="bg-red-600 hover:bg-red-600">declined</Badge>}
                      </TableCell>
                      <TableCell>{fmtDate(r.created_at)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

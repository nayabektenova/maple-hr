"use client";

import * as React from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
} from "@/components/ui/table";

type Row = {
  id: string;
  type: "Leave";
  user_id: string;
  employee_name: string | null;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  status: "pending" | "approved" | "declined";
  created_at: string;
  processed_at: string | null;
  decline_reason: string | null;
};

function fmtDate(d?: string | null) {
  if (!d) return "—";
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? d : dt.toLocaleString();
}

export default function TimeOff() {
  const [uid, setUid] = React.useState<string | null>(null);
  const [displayName, setDisplayName] = React.useState<string | null>(null);

  // form
  const [start, setStart] = React.useState("");
  const [end, setEnd] = React.useState("");
  const [notes, setNotes] = React.useState("");

  // list
  const [rows, setRows] = React.useState<Row[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  // Resolve user once on mount
  React.useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      const newUid = user?.id ?? null;
      setUid(newUid);

      if (newUid) {
        // optional display name
        const { data: prof } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", newUid)
          .maybeSingle();
        setDisplayName((prof as any)?.full_name ?? null);

        await load(newUid);
      }
    })();
  }, []);

  async function load(userId: string) {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("requests")
        .select("*")
        .eq("user_id", userId)
        .eq("type", "Leave")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRows((data as Row[]) ?? []);
    } catch (e: any) {
      setError(e.message ?? "Failed to load time off requests.");
    } finally {
      setLoading(false);
    }
  }

  async function refresh() {
    setSuccess(null);
    setError(null);
    // Re-resolve the current user so Refresh works even if uid was null
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id ?? null;
    setUid(userId);
    if (!userId) {
      setError("You are not signed in.");
      return;
    }
    await load(userId);
  }

  async function submit() {
    if (!uid) {
      setError("You are not signed in.");
      return;
    }
    if (!start || !end) {
      setError("Please choose start and end dates.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = {
        user_id: uid,
        employee_name: displayName ?? null,
        type: "Leave" as const,
        start_date: start,
        end_date: end,
        notes: notes || null,
        status: "pending" as const,
      };
      const { error } = await supabase.from("requests").insert(payload);
      if (error) throw error;

      setStart("");
      setEnd("");
      setNotes("");
      setSuccess("Time off request submitted.");
      await load(uid); // immediate refetch
    } catch (e: any) {
      setError(e.message ?? "Submit failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Request Time Off</h1>
        <Button variant="outline" onClick={refresh} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh"}
        </Button>
      </div>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          {success}
        </div>
      )}

      {/* Submit form */}
      <Card>
        <CardHeader>
          <CardTitle>New Time Off Request</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-1">
            <label className="text-sm">Start date</label>
            <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div className="grid gap-1">
            <label className="text-sm">End date</label>
            <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
          <div className="md:col-span-2 grid gap-1">
            <label className="text-sm">Notes (optional)</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Reason, context, etc."
            />
          </div>
          <div className="md:col-span-2">
            <Button onClick={submit} disabled={submitting}>
              {submitting ? "Submitting…" : "Submit request"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle>My Time Off</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dates</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    {r.start_date || r.end_date ? `${r.start_date ?? "—"} → ${r.end_date ?? "—"}` : "—"}
                  </TableCell>
                  <TableCell className="max-w-[380px] truncate">{r.notes ?? "—"}</TableCell>
                  <TableCell className={
                    r.status === "pending" ? "text-yellow-700" :
                    r.status === "approved" ? "text-green-700" : "text-red-700"
                  }>
                    {r.status}
                  </TableCell>
                  <TableCell>{fmtDate(r.created_at)}</TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-sm text-gray-500">
                    {loading ? "Loading…" : uid ? "No time off requests yet." : "Sign in to view requests."}
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

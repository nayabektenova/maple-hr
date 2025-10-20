"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { RefreshCw, Check, X, Eye, Filter } from "lucide-react";

type RequestRow = {
  id: string;
  user_id: string;
  employee_name: string | null;
  type: "Leave" | "Shift Change" | "Expense";
  notes: string | null;
  start_date: string | null;
  end_date: string | null;
  amount: number | null;
  status: "pending" | "approved" | "declined";
  processed_at: string | null;
  processed_by: string | null;
  decline_reason: string | null;
  created_at: string | null;
};

const TYPED_OPTIONS = ["All", "Leave", "Shift Change", "Expense"] as const;
const STATUS_OPTIONS = ["All", "pending", "approved", "declined"] as const;

function fmtDate(d?: string | null) {
  if (!d) return "—";
  const t = new Date(d);
  return isNaN(t.getTime()) ? d : t.toLocaleString();
}

function chip(status: RequestRow["status"]) {
  if (status === "pending") return <Badge variant="secondary">pending</Badge>;
  if (status === "approved") return <Badge className="bg-green-600 hover:bg-green-600">approved</Badge>;
  return <Badge className="bg-red-600 hover:bg-red-600">declined</Badge>;
}

export default function LeavesAdmin() {
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<(typeof TYPED_OPTIONS)[number]>("All");
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_OPTIONS)[number]>("All"); // default to All
  const [search, setSearch] = useState("");

  async function fetchRows() {
    setLoading(true);
    setMessage(null);

    const { data, error } = await supabase
      .from("requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(`Load failed: ${error.message}`);
      setRows([]);
    } else {
      setRows((data ?? []) as RequestRow[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    fetchRows();
  }, []);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const typeOk = typeFilter === "All" || r.type === typeFilter;
      const statusOk = statusFilter === "All" || r.status === statusFilter;
      const s = search.trim().toLowerCase();
      const text =
        `${r.employee_name ?? ""} ${r.type} ${r.notes ?? ""} ${r.start_date ?? ""} ${r.end_date ?? ""}`.toLowerCase();
      const searchOk = !s || text.includes(s);
      return typeOk && statusOk && searchOk;
    });
  }, [rows, typeFilter, statusFilter, search]);

  async function refetch() {
    await fetchRows();
  }

  async function handleApprove(id: string) {
    try {
      setMessage(null);
      setBusyId(id);

      const { data: ures } = await supabase.auth.getUser();
      const processedBy = ures.user?.id ?? null;

      const { error } = await supabase
        .from("requests")
        .update({
          status: "approved",
          processed_at: new Date().toISOString(),
          processed_by: processedBy,
          decline_reason: null,
        })
        .eq("id", id)
        .select(); // force execution + surface RLS errors

      setBusyId(null);

      if (error) {
        setMessage(`Approve failed: ${error.message}`);
        return;
      }
      setMessage("Request approved.");
      await refetch();
    } catch (e: any) {
      setBusyId(null);
      setMessage(e?.message ?? "Approve failed.");
    }
  }

  async function handleDecline(id: string) {
    try {
      const reason = window.prompt("Optional decline reason:");
      setMessage(null);
      setBusyId(id);

      const { data: ures } = await supabase.auth.getUser();
      const processedBy = ures.user?.id ?? null;

      const { error } = await supabase
        .from("requests")
        .update({
          status: "declined",
          processed_at: new Date().toISOString(),
          processed_by: processedBy,
          decline_reason: reason ?? null,
        })
        .eq("id", id)
        .select(); // force execution + surface RLS errors

      setBusyId(null);

      if (error) {
        setMessage(`Decline failed: ${error.message}`);
        return;
      }
      setMessage("Request declined.");
      await refetch();
    } catch (e: any) {
      setBusyId(null);
      setMessage(e?.message ?? "Decline failed.");
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>Leaves / Requests</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <Select value={typeFilter} onValueChange={(v: any) => setTypeFilter(v)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  {TYPED_OPTIONS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Input
              placeholder="Search name/notes/dates"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-[220px]"
            />

            <Button variant="outline" onClick={refetch}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {message && (
            <div className="mb-3 rounded border border-blue-200 bg-blue-50 p-2 text-sm text-blue-900">{message}</div>
          )}

          {loading ? (
            <div className="text-sm text-gray-600">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="text-sm text-gray-600">No requests found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Dates / Amount</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id} className="align-top">
                    <TableCell className="pt-3">
                      <Eye className="w-4 h-4 text-gray-500" />
                    </TableCell>
                    <TableCell className="pt-3">
                      <div className="font-medium">{r.employee_name || "—"}</div>
                      <div className="text-xs text-gray-500">{fmtDate(r.created_at)}</div>
                    </TableCell>
                    <TableCell className="pt-3">{r.type}</TableCell>
                    <TableCell className="pt-3">
                      {r.type === "Expense" ? (
                        <span>${(r.amount ?? 0).toFixed(2)}</span>
                      ) : (
                        <span>
                          {r.start_date || "—"} → {r.end_date || "—"}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="pt-3">{r.notes || "—"}</TableCell>
                    <TableCell className="pt-3">{chip(r.status)}</TableCell>
                    <TableCell className="pt-2 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          disabled={r.status !== "pending" || busyId === r.id}
                          onClick={() => handleApprove(r.id)}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={r.status !== "pending" || busyId === r.id}
                          onClick={() => handleDecline(r.id)}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Decline
                        </Button>
                      </div>
                      {r.status !== "pending" && (
                        <div className="mt-1 text-xs text-gray-500">
                          {r.status} {r.processed_at ? `on ${fmtDate(r.processed_at)}` : ""}{" "}
                          {r.decline_reason ? `• Reason: ${r.decline_reason}` : ""}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

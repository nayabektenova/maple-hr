<<<<<<< Updated upstream
// components/requests.tsx
=======
/* AI-assisted: Parts of this file were generated with AI and then edited by me. I reviewed and tested all changes.
Prompt: "hr requests page: supabase select+update; search/filter; view/approve/decline; demo seed+reset. keep it simple." */

>>>>>>> Stashed changes
"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Search, Check, X, Eye, RotateCcw } from "lucide-react";

type RequestStatus = "pending" | "approved" | "declined";
type HrType = "Leave" | "Shift Change" | "Expense";
type HrRequest = {
  id: string;
  type: HrType;
  employeeId: string;
  employeeName: string;
  submittedAt: string;
  dateRange?: { start: string; end: string };
  amount?: number;
  notes?: string;
  status: RequestStatus;
  processedAt?: string;
  processedBy?: string;
  declineReason?: string;
};

const KEY = "maplehr_requests_v3";
const uid = () => crypto?.randomUUID?.() ?? `id_${Math.random().toString(36).slice(2)}`;
const fmt = (d: string) => { const t = new Date(d); return isNaN(t.getTime()) ? d : t.toLocaleString(); };
const load = (): HrRequest[] => { try { const raw = localStorage.getItem(KEY); const arr = raw ? (JSON.parse(raw) as HrRequest[]) : []; return Array.isArray(arr) ? arr : []; } catch { return []; } };
const save = (rows: HrRequest[]) => localStorage.setItem(KEY, JSON.stringify(rows));
const seed = () =>
  save([
    { id: uid(), type: "Leave", employeeId: "000915041", employeeName: "Abel Fekadu", submittedAt: new Date(Date.now() - 3 * 864e5).toISOString(), dateRange: { start: "2025-09-20", end: "2025-09-25" }, notes: "Family trip – PTO", status: "pending" },
    { id: uid(), type: "Shift Change", employeeId: "000394998", employeeName: "Hunter Tapping", submittedAt: new Date(Date.now() - 20 * 36e5).toISOString(), dateRange: { start: "2025-09-22", end: "2025-09-22" }, notes: "Swap evening shift with Naya", status: "pending" },
    { id: uid(), type: "Expense", employeeId: "000957380", employeeName: "Naya Bektenova", submittedAt: new Date(Date.now() - 6 * 36e5).toISOString(), amount: 124.56, notes: "Conference taxi receipts", status: "pending" },
  ]);

export default function Requests() {
  const [rows, setRows] = React.useState<HrRequest[]>([]);
  const [q, setQ] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<"" | HrType>("");
  const [statusFilter, setStatusFilter] = React.useState<"" | RequestStatus>("");

  const [viewOpen, setViewOpen] = React.useState(false);
  const [declineOpen, setDeclineOpen] = React.useState(false);
  const [sel, setSel] = React.useState<HrRequest | null>(null);
  const [reason, setReason] = React.useState("");

  React.useEffect(() => {
    const existing = load();
    if (!existing.length) seed();
    setRows(load());
  }, []);

  const list = React.useMemo(() => {
    let r = rows.slice();
    if (q.trim()) {
      const s = q.toLowerCase();
      r = r.filter((x) => `${x.employeeName} ${x.employeeId} ${x.type} ${x.notes ?? ""}`.toLowerCase().includes(s));
    }
    if (typeFilter) r = r.filter((x) => x.type === typeFilter);
    if (statusFilter) r = r.filter((x) => x.status === statusFilter);
    return r.sort((a, b) => +new Date(b.submittedAt) - +new Date(a.submittedAt));
  }, [rows, q, typeFilter, statusFilter]);

  const patch = (next: HrRequest) =>
    setRows((prev) => { const arr = prev.map((x) => (x.id === next.id ? next : x)); save(arr); return arr; });

  const approve = (r: HrRequest) =>
    r.status === "pending" && patch({ ...r, status: "approved", processedAt: new Date().toISOString(), processedBy: "Admin" });

  const decline = (r: HrRequest, why: string) =>
    r.status === "pending" &&
    patch({ ...r, status: "declined", processedAt: new Date().toISOString(), processedBy: "Admin", declineReason: why || undefined });

  const reset = () => { seed(); setRows(load()); setQ(""); setTypeFilter(""); setStatusFilter(""); setSel(null); setViewOpen(false); setDeclineOpen(false); setReason(""); };

  const StatusBadge = ({ s }: { s: RequestStatus }) => (
    <Badge variant={s === "pending" ? "secondary" : s === "approved" ? "default" : "destructive"}>{s}</Badge>
  );

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="text-base">Request Management</CardTitle>
        <Button variant="outline" size="sm" onClick={reset}>
          <RotateCcw className="mr-2 h-4 w-4" /> Reset demo data
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="grid gap-3 md:grid-cols-[1fr_200px_200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, ID, notes…" className="pl-9" />
          </div>

          {/* Selects use 'all' sentinel to avoid empty value error */}
          <Select value={typeFilter || "all"} onValueChange={(v) => setTypeFilter(v === "all" ? "" : (v as HrType))}>
            <SelectTrigger><SelectValue placeholder="Type (All)" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="Leave">Leave</SelectItem>
              <SelectItem value="Shift Change">Shift Change</SelectItem>
              <SelectItem value="Expense">Expense</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter || "all"} onValueChange={(v) => setStatusFilter(v === "all" ? "" : (v as RequestStatus))}>
            <SelectTrigger><SelectValue placeholder="Status (All)" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="declined">Declined</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[220px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((r) => (
              <TableRow key={r.id} className="hover:bg-gray-50">
                {/* TYPE with icon-only “view” on the LEFT */}
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="View details"
                      onClick={() => { setSel(r); setViewOpen(true); }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <span>{r.type}</span>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="leading-tight">
                    <div className="font-medium">{r.employeeName}</div>
                    <div className="text-xs text-muted-foreground">ID: {r.employeeId}</div>
                  </div>
                </TableCell>
                <TableCell className="text-gray-600">{fmt(r.submittedAt)}</TableCell>
                <TableCell className="text-gray-700">
                  {r.type === "Expense" && typeof r.amount === "number"
                    ? `Amount: $${r.amount.toFixed(2)}`
                    : r.dateRange
                    ? `Dates: ${r.dateRange.start} → ${r.dateRange.end}`
                    : r.notes ?? "—"}
                </TableCell>
                <TableCell><StatusBadge s={r.status} /></TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" className="bg-green-600 hover:bg-green-700" disabled={r.status !== "pending"} onClick={() => approve(r)}>
                      <Check className="mr-2 h-4 w-4" /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={r.status !== "pending"}
                      onClick={() => { setSel(r); setReason(""); setDeclineOpen(true); }}
                    >
                      <X className="mr-2 h-4 w-4" /> Decline
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {list.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                  No requests match your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* View dialog */}
        <Dialog open={viewOpen} onOpenChange={setViewOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Request Details</DialogTitle></DialogHeader>
            {!sel ? (
              <div className="text-sm text-muted-foreground">Nothing selected.</div>
            ) : (
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Type:</span> {sel.type}</div>
                <div><span className="font-medium">Employee:</span> {sel.employeeName} ({sel.employeeId})</div>
                <div><span className="font-medium">Submitted:</span> {fmt(sel.submittedAt)}</div>
                {sel.dateRange && <div><span className="font-medium">Dates:</span> {sel.dateRange.start} → {sel.dateRange.end}</div>}
                {typeof sel.amount === "number" && <div><span className="font-medium">Amount:</span> ${sel.amount.toFixed(2)}</div>}
                {sel.notes && <div><span className="font-medium">Notes:</span> {sel.notes}</div>}
                <Separator />
                <div className="flex items-center gap-2">
                  <StatusBadge s={sel.status} />
                  {sel.processedAt && (
                    <span className="text-xs text-muted-foreground">
                      Processed {fmt(sel.processedAt)} by {sel.processedBy ?? "—"}
                    </span>
                  )}
                </div>
                {sel.declineReason && <div className="text-xs text-muted-foreground">Reason: {sel.declineReason}</div>}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Decline dialog */}
        <Dialog open={declineOpen} onOpenChange={setDeclineOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Decline Request</DialogTitle></DialogHeader>
            <Textarea rows={3} placeholder="Optional: decline reason" value={reason} onChange={(e) => setReason(e.target.value)} />
            <div className="flex gap-2 pt-2">
              <Button
                variant="destructive"
                onClick={() => { if (sel) decline(sel, reason); setDeclineOpen(false); setSel(null); setReason(""); }}
              >
                Confirm decline
              </Button>
              <Button variant="outline" onClick={() => setDeclineOpen(false)}>Cancel</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

// TOP OF FILE
"use client";

import * as React from "react";
// import Link from "next/link"; // keep only if you actually link somewhere
import { Search, Filter, Check, X, Eye, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


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
  <div className="bg-white rounded-lg border border-gray-200 px-8">
    {/* Top toolbar */}
    <div className="px-6 py-4 border-b border-gray-200 flex flex-col gap-2">
      <div className="flex items-center gap-4">
        {/* Search input with icon */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setQ(e.target.value); }}
            className="pl-10"
          />
        </div>

        {/* Filters dropdown (Type + Status) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
              <Filter className="h-4 w-4" />
              Filters
              {typeFilter ? `: ${typeFilter}` : ""}
              {statusFilter ? ` • ${statusFilter}` : ""}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuLabel>Type</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setTypeFilter("")}>All</DropdownMenuItem>
            {(["Leave", "Shift Change", "Expense"] as HrType[]).map((t) => (
              <DropdownMenuItem key={t} onClick={() => setTypeFilter(t)}>{t}</DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Status</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setStatusFilter("")}>All</DropdownMenuItem>
            {(["pending", "approved", "declined"] as RequestStatus[]).map((s) => (
              <DropdownMenuItem key={s} onClick={() => setStatusFilter(s)}>{s}</DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => { setTypeFilter(""); setStatusFilter(""); }}>
              Clear filters
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Reset demo data button */}
        <Button variant="outline" size="sm" onClick={reset}>
          <RotateCcw className="mr-2 h-4 w-4" /> Reset demo data
        </Button>
      </div>
    </div>

        <Separator />

        {/* Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-40">Type</TableHead>
              <TableHead className="w-[260px]">Employee</TableHead>
              <TableHead className="w-48">Submitted</TableHead>
              <TableHead>Details</TableHead>
              <TableHead className="w-28">Status</TableHead>
              <TableHead className="w-64 text-right"></TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {list.map((r) => (
              <TableRow key={r.id} className="hover:bg-gray-50">
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-3">
                    {/* View — outline green */}
                    <Button
                      variant="outline"
                      className="border-green-600 text-green-700 hover:bg-green-50"
                      onClick={() => { setSel(r); setViewOpen(true); }}
                    >
                      <Eye className="mr-2 h-4 w-4" /> View
                    </Button>

                    {/* Approve — solid green */}
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      disabled={r.status !== "pending"}
                      onClick={() => approve(r)}
                    >
                      <Check className="mr-2 h-4 w-4" /> Approve
                    </Button>

                    {/* Decline — red text link */}
                    <button
                      className="text-red-600 hover:underline text-sm"
                      disabled={r.status !== "pending"}
                      onClick={() => { setSel(r); setReason(""); setDeclineOpen(true); }}
                    >
                      <span className="inline-flex items-center">
                        <X className="mr-2 h-4 w-4" /> Decline
                      </span>
                    </button>
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

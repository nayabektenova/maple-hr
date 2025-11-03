"use client";

import * as React from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type Plan = {
  id: string;
  name: string;
  description: string | null;
  premium_employee: number;
  premium_employer: number;
  coverage: Record<string, string> | null;
  active: boolean;
};

type EmpBen = {
  id: string;
  user_id: string;
  plan_id: string | null;
  status: "active" | "pending" | "ended";
  effective_from: string | null;
  effective_to: string | null;
  dependents: Array<{ name: string; rel?: string }> | null;
  created_at: string | null;
  plan?: Plan | null;
};

export default function EmployeeBenefits() {
  const [uid, setUid] = React.useState<string | null>(null);
  const [rows, setRows] = React.useState<EmpBen[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [msg, setMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUid(data.user?.id ?? null));
  }, []);

  async function fetchMine() {
    if (!uid) return;
    setLoading(true);
    setMsg(null);

    // fetch enrollments
    const { data: eb, error } = await supabase
      .from("employee_benefits")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });

    if (error) {
      setMsg(error.message);
      setRows([]);
      setLoading(false);
      return;
    }

    // fetch plan catalog for joins
    const { data: plans } = await supabase.from("benefits_plans").select("*");
    const planById = new Map<string, Plan>(
      (plans ?? []).map((p: any) => [p.id, p as Plan])
    );

    const merged = (eb ?? []).map((r: any) => ({
      ...r,
      plan: r.plan_id ? planById.get(r.plan_id) ?? null : null,
    })) as EmpBen[];

    setRows(merged);
    setLoading(false);
  }

  React.useEffect(() => {
    if (uid) fetchMine();
  }, [uid]);

  const active = rows.find(r => r.status === "active");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="text-base">My Benefits</CardTitle>
          <Button variant="outline" size="sm" onClick={fetchMine}>Refresh</Button>
        </CardHeader>
        <CardContent>
          {msg && <div className="mb-3 text-sm text-red-600">{msg}</div>}
          {loading ? (
            <div className="text-sm text-gray-600">Loading…</div>
          ) : rows.length === 0 ? (
            <div className="text-sm text-gray-600">No benefits found.</div>
          ) : (
            <>
              {active && (
                <div className="mb-6">
                  <div className="text-sm text-gray-500 mb-1">Current Plan</div>
                  <div className="rounded border p-4">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{active.plan?.name ?? "No plan"}</div>
                      <Badge>{active.status}</Badge>
                    </div>
                    {active.plan?.description && (
                      <div className="text-sm text-gray-600 mt-1">{active.plan.description}</div>
                    )}
                    <div className="grid md:grid-cols-2 gap-3 mt-3 text-sm">
                      <div>Effective from: <strong>{active.effective_from ?? "—"}</strong></div>
                      <div>Effective to: <strong>{active.effective_to ?? "—"}</strong></div>
                      <div>Employee premium (per pay): <strong>${(active.plan?.premium_employee ?? 0).toFixed(2)}</strong></div>
                      <div>Employer premium (per pay): <strong>${(active.plan?.premium_employer ?? 0).toFixed(2)}</strong></div>
                    </div>
                    {active.plan?.coverage && (
                      <div className="mt-3">
                        <div className="text-sm text-gray-500 mb-1">Coverage</div>
                        <ul className="list-disc pl-5 text-sm">
                          {Object.entries(active.plan.coverage).map(([k, v]) => (
                            <li key={k}><strong>{k}:</strong> {v}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {active.dependents && active.dependents.length > 0 && (
                      <div className="mt-3">
                        <div className="text-sm text-gray-500 mb-1">Dependents</div>
                        <ul className="list-disc pl-5 text-sm">
                          {active.dependents.map((d, i) => (
                            <li key={i}>{d.name}{d.rel ? ` (${d.rel})` : ""}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="text-sm text-gray-500 mb-2">All enrollments</div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Employee Premium</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map(r => (
                    <TableRow key={r.id}>
                      <TableCell>{r.plan?.name ?? "—"}</TableCell>
                      <TableCell><Badge variant="secondary">{r.status}</Badge></TableCell>
                      <TableCell>{r.effective_from ?? "—"}</TableCell>
                      <TableCell>{r.effective_to ?? "—"}</TableCell>
                      <TableCell>${(r.plan?.premium_employee ?? 0).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

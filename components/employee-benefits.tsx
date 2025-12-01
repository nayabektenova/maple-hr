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
  const [selectedPlan, setSelectedPlan] = React.useState<EmpBen | null>(null);

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUid(data.user?.id ?? null));
  }, []);

  async function fetchMine() {
    setLoading(true);
    setMsg(null);

    try {
      // Fetch benefits with proper join to plans
      const { data: eb, error } = await supabase
        .from("employee_benefits")
        .select(`
          *,
          benefits_plans (
            id,
            name,
            provider,
            description,
            coverage,
            premium_employee,
            premium_employer,
            employee_cost,
            employer_cost
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error('Error fetching benefits:', error);
        setMsg(`Error: ${error.message}`);
        setRows([]);
      } else {
        console.log('Fetched benefits with plans:', eb);
        
        // Transform the data to match your type
        const merged = (eb || []).map((r: any) => ({
          ...r,
          plan: r.benefits_plans || null
        })) as EmpBen[];
        
        setRows(merged);
        
        // Set the initially selected plan to the active one
        const activePlan = merged.find(r => r.status === "active");
        setSelectedPlan(activePlan || merged[0] || null);
        
        console.log('Merged rows:', merged);
      }
    } catch (error: any) {
      console.error('Unexpected error:', error);
      setMsg(`Error: ${error.message}`);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    if (uid) fetchMine();
  }, [uid]);

  const handlePlanClick = (plan: EmpBen) => {
    setSelectedPlan(plan);
  };

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
              {selectedPlan && (
                <div className="mb-6">
                  <div className="text-sm text-gray-500 mb-1">
                    {selectedPlan.status === "active" ? "Current Plan" : "Selected Plan"}
                  </div>
                  <div className="rounded border p-4">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{selectedPlan.plan?.name ?? "No plan"}</div>
                      <Badge>{selectedPlan.status}</Badge>
                    </div>
                    {selectedPlan.plan?.description && (
                      <div className="text-sm text-gray-600 mt-1">{selectedPlan.plan.description}</div>
                    )}
                    <div className="grid md:grid-cols-2 gap-3 mt-3 text-sm">
                      <div>Effective from: <strong>{selectedPlan.effective_from ?? "—"}</strong></div>
                      <div>Effective to: <strong>{selectedPlan.effective_to ?? "—"}</strong></div>
                      <div>Employee premium (per pay): <strong>${(selectedPlan.plan?.premium_employee ?? 0).toFixed(2)}</strong></div>
                      <div>Employer premium (per pay): <strong>${(selectedPlan.plan?.premium_employer ?? 0).toFixed(2)}</strong></div>
                    </div>
                    {selectedPlan.plan?.coverage && (
                      <div className="mt-3">
                        <div className="text-sm text-gray-500 mb-1">Coverage</div>
                        <ul className="list-disc pl-5 text-sm">
                          {Object.entries(selectedPlan.plan.coverage).map(([k, v]) => (
                            <li key={k}><strong>{k}:</strong> {v}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {selectedPlan.dependents && selectedPlan.dependents.length > 0 && (
                      <div className="mt-3">
                        <div className="text-sm text-gray-500 mb-1">Dependents</div>
                        <ul className="list-disc pl-5 text-sm">
                          {selectedPlan.dependents.map((d, i) => (
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
                    <TableRow 
                      key={r.id} 
                      className={`cursor-pointer hover:bg-gray-50 ${
                        selectedPlan?.id === r.id ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => handlePlanClick(r)}
                    >
                      <TableCell className="font-medium">{r.plan?.name ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant={r.status === "active" ? "default" : "secondary"}>
                          {r.status}
                        </Badge>
                      </TableCell>
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
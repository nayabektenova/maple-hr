"use client";

import * as React from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

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
};

export default function HRBenefitsAdmin() {
  const [plans, setPlans] = React.useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = React.useState(true);
  const [msgPlans, setMsgPlans] = React.useState<string | null>(null);

  const [assignEmailOrUserId, setAssignEmailOrUserId] = React.useState("");
  const [assignPlanId, setAssignPlanId] = React.useState<string>("");
  const [assignFrom, setAssignFrom] = React.useState<string>("");
  const [assignStatus, setAssignStatus] = React.useState<"active"|"pending"|"ended">("active");
  const [savingAssign, setSavingAssign] = React.useState(false);
  const [msgAssign, setMsgAssign] = React.useState<string | null>(null);

  // plan editor
  const [newPlan, setNewPlan] = React.useState({
    name: "",
    description: "",
    premium_employee: "0",
    premium_employer: "0",
    coverage: `{"health":"80%","dental":"70%","vision":"$200/2y"}`,
    active: "true",
  });
  const [savingPlan, setSavingPlan] = React.useState(false);

  async function fetchPlans() {
    setLoadingPlans(true);
    setMsgPlans(null);
    const { data, error } = await supabase.from("benefits_plans").select("*").order("created_at", { ascending: false });
    if (error) setMsgPlans(error.message);
    setPlans((data ?? []) as any);
    setLoadingPlans(false);
  }

  React.useEffect(() => {
    fetchPlans();
  }, []);

  async function createPlan() {
    setSavingPlan(true);
    setMsgPlans(null);
    try {
      let coverage: any = null;
      try { coverage = JSON.parse(newPlan.coverage || "null"); } catch { coverage = null; }

      const { error } = await supabase.from("benefits_plans").insert([{
        name: newPlan.name.trim(),
        description: newPlan.description.trim() || null,
        premium_employee: Number(newPlan.premium_employee) || 0,
        premium_employer: Number(newPlan.premium_employer) || 0,
        coverage,
        active: newPlan.active === "true",
      }]);

      if (error) throw error;
      setNewPlan({
        name: "", description: "", premium_employee: "0", premium_employer: "0",
        coverage: `{"health":"80%","dental":"70%","vision":"$200/2y"}`, active: "true"
      });
      await fetchPlans();
    } catch (e: any) {
      setMsgPlans(e.message || "Create failed");
    } finally {
      setSavingPlan(false);
    }
  }

  async function togglePlanActive(p: Plan) {
    const { error } = await supabase
      .from("benefits_plans")
      .update({ active: !p.active })
      .eq("id", p.id);
    if (error) { setMsgPlans(error.message); return; }
    await fetchPlans();
  }

  // Try to resolve a user_id: first by business_details.email, else treat input as UUID
  async function resolveUserId(emailOrUserId: string): Promise<string | null> {
    const v = emailOrUserId.trim();
    if (!v) return null;

    // Try business_details.email -> user_id
    const { data, error } = await supabase
      .from("business_details")
      .select("user_id")
      .eq("email", v)
      .maybeSingle();

    if (!error && data?.user_id) return data.user_id;

    // If looks like a UUID, use it
    if (/^[0-9a-f-]{20,}$/i.test(v)) return v;
    return null;
  }

  async function assignPlan() {
    setSavingAssign(true);
    setMsgAssign(null);
    try {
      const userId = await resolveUserId(assignEmailOrUserId);
      if (!userId) throw new Error("Could not resolve user. Enter a known email (business_details) or a user_id UUID.");

      if (!assignPlanId) throw new Error("Select a plan.");
      const payload: Partial<EmpBen> = {
        user_id: userId,
        plan_id: assignPlanId,
        effective_from: assignFrom || new Date().toISOString().slice(0,10),
        status: assignStatus
      };

      const { error } = await supabase.from("employee_benefits").insert([payload]);
      if (error) throw error;

      setAssignEmailOrUserId("");
      setAssignPlanId("");
      setAssignFrom("");
      setAssignStatus("active");
      setMsgAssign("Assigned!");
    } catch (e: any) {
      setMsgAssign(e.message || "Assignment failed");
    } finally {
      setSavingAssign(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Plan catalog */}
      <Card>
        <CardHeader><CardTitle className="text-base">Benefits Plans</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {msgPlans && <div className="text-sm text-red-600">{msgPlans}</div>}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm">Name</label>
              <Input value={newPlan.name} onChange={e => setNewPlan(p => ({...p, name: e.target.value}))} placeholder="Standard Health & Dental" />
            </div>
            <div className="space-y-2">
              <label className="text-sm">Employee Premium (per pay)</label>
              <Input type="number" value={newPlan.premium_employee} onChange={e => setNewPlan(p => ({...p, premium_employee: e.target.value}))} />
            </div>
            <div className="space-y-2">
              <label className="text-sm">Employer Premium (per pay)</label>
              <Input type="number" value={newPlan.premium_employer} onChange={e => setNewPlan(p => ({...p, premium_employer: e.target.value}))} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm">Description</label>
              <Textarea rows={2} value={newPlan.description} onChange={e => setNewPlan(p => ({...p, description: e.target.value}))} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm">Coverage (JSON)</label>
              <Textarea rows={3} value={newPlan.coverage} onChange={e => setNewPlan(p => ({...p, coverage: e.target.value}))} />
            </div>
            <div className="space-y-2">
              <label className="text-sm">Active</label>
              <Select value={newPlan.active} onValueChange={v => setNewPlan(p => ({...p, active: v}))}>
                <SelectTrigger><SelectValue placeholder="true/false" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">true</SelectItem>
                  <SelectItem value="false">false</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button className="bg-green-600 hover:bg-green-700" disabled={savingPlan} onClick={createPlan}>
                {savingPlan ? "Saving…" : "Create Plan"}
              </Button>
            </div>
          </div>

          <div className="mt-6">
            {loadingPlans ? (
              <div className="text-sm text-gray-600">Loading plans…</div>
            ) : plans.length === 0 ? (
              <div className="text-sm text-gray-600">No plans yet.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Employee Premium</TableHead>
                    <TableHead>Employer Premium</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map(p => (
                    <TableRow key={p.id}>
                      <TableCell>{p.name}</TableCell>
                      <TableCell>${p.premium_employee.toFixed(2)}</TableCell>
                      <TableCell>${p.premium_employer.toFixed(2)}</TableCell>
                      <TableCell>{String(p.active)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => togglePlanActive(p)}>
                          {p.active ? "Deactivate" : "Activate"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Assign plan */}
      <Card>
        <CardHeader><CardTitle className="text-base">Assign Plan to Employee</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {msgAssign && <div className="text-sm">{msgAssign}</div>}

          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm">Employee Email (business_details) OR User ID (UUID)</label>
              <Input value={assignEmailOrUserId} onChange={e => setAssignEmailOrUserId(e.target.value)} placeholder="jane@company.com or 123e4567-e89b-12d3-a456-426614174000" />
            </div>
            <div className="space-y-2">
              <label className="text-sm">Plan</label>
              <Select value={assignPlanId} onValueChange={setAssignPlanId}>
                <SelectTrigger><SelectValue placeholder="Select a plan" /></SelectTrigger>
                <SelectContent>
                  {plans.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm">Effective From</label>
              <Input type="date" value={assignFrom} onChange={e => setAssignFrom(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm">Status</label>
              <Select value={assignStatus} onValueChange={(v: any) => setAssignStatus(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">active</SelectItem>
                  <SelectItem value="pending">pending</SelectItem>
                  <SelectItem value="ended">ended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button className="bg-green-600 hover:bg-green-700" disabled={savingAssign} onClick={assignPlan}>
            {savingAssign ? "Assigning…" : "Assign Plan"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

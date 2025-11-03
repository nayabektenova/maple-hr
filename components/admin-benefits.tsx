"use client";

import * as React from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Heart, Shield } from "lucide-react";

type PlanRow = {
  id: string;
  provider: string;
  name: string;
  tier: string | null;
  coverage: any;
  employee_cost: number | null;
  employer_cost: number | null;
  active: boolean | null;
  created_at: string | null;
};

type EmployeeRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email?: string | null;
};

type EmployeeBenefitRow = {
  id: string;
  employee_id: string;
  plan_id: string;
  effective_date: string | null;
  status: "active" | "pending" | "terminated" | null;
};

const CAD = (n: number) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(n);

// ---------- Provider templates (editable) ----------
const PLAN_TEMPLATES: {
  provider: string;
  plans: Array<{
    name: string;
    tier: "Bronze" | "Silver" | "Gold";
    employee_cost: number;   // per pay period (example)
    employer_cost: number;   // per pay period (example)
    coverage: {
      health: { drugs: string; paramedical: string; hospital: string };
      dental: { basic: string; major: string; ortho?: string };
      vision: { exam: string; glasses_contacts: string };
      life: { employee: string; dependent?: string };
      disability?: { std?: string; ltd?: string };
      travel?: string;
    };
  }>;
}[] = [
  {
    provider: "Alberta Blue Cross",
    plans: [
      {
        name: "ABX Health & Dental Bronze",
        tier: "Bronze",
        employee_cost: 22,
        employer_cost: 78,
        coverage: {
          health: { drugs: "80% up to $2,000/yr", paramedical: "$300/yr", hospital: "Semi-private" },
          dental: { basic: "70% up to $1,000/yr", major: "—" },
          vision: { exam: "Every 2 years", glasses_contacts: "$200/24 mo" },
          life: { employee: "$25,000", dependent: "$10,000 spouse/$5,000 child" },
          travel: "Emergency $1M, 15 days"
        }
      },
      {
        name: "ABX Health & Dental Silver",
        tier: "Silver",
        employee_cost: 30,
        employer_cost: 95,
        coverage: {
          health: { drugs: "90% up to $3,000/yr", paramedical: "$500/yr", hospital: "Semi-private" },
          dental: { basic: "80% up to $1,500/yr", major: "50% up to $1,000/yr" },
          vision: { exam: "Annually", glasses_contacts: "$300/24 mo" },
          life: { employee: "$50,000", dependent: "$15,000 spouse/$7,500 child" },
          disability: { std: "Yes (66.7%)" },
          travel: "Emergency $2M, 30 days"
        }
      },
      {
        name: "ABX Health & Dental Gold",
        tier: "Gold",
        employee_cost: 42,
        employer_cost: 130,
        coverage: {
          health: { drugs: "100% up to $5,000/yr", paramedical: "$800/yr", hospital: "Private (where available)" },
          dental: { basic: "90% up to $2,000/yr", major: "60% up to $1,500/yr", ortho: "50% up to $2,000 lifetime" },
          vision: { exam: "Annually", glasses_contacts: "$400/24 mo" },
          life: { employee: "$100,000", dependent: "$20,000 spouse/$10,000 child" },
          disability: { std: "Yes (66.7%)", ltd: "Yes (60%)" },
          travel: "Emergency $5M, 45 days"
        }
      }
    ]
  },
  {
    provider: "Sun Life",
    plans: [
      {
        name: "Sun Life Core",
        tier: "Bronze",
        employee_cost: 24,
        employer_cost: 80,
        coverage: {
          health: { drugs: "80% up to $2,000/yr", paramedical: "$300/yr", hospital: "Semi-private" },
          dental: { basic: "70% up to $1,000/yr", major: "—" },
          vision: { exam: "Every 2 years", glasses_contacts: "$200/24 mo" },
          life: { employee: "$25,000" },
          travel: "Emergency $1M, 15 days"
        }
      },
      {
        name: "Sun Life Enhanced",
        tier: "Silver",
        employee_cost: 33,
        employer_cost: 100,
        coverage: {
          health: { drugs: "90% up to $3,500/yr", paramedical: "$600/yr", hospital: "Semi-private" },
          dental: { basic: "80% up to $1,750/yr", major: "50% up to $1,250/yr" },
          vision: { exam: "Annually", glasses_contacts: "$300/24 mo" },
          life: { employee: "$50,000" },
          disability: { std: "Yes (66.7%)" },
          travel: "Emergency $2M, 30 days"
        }
      },
      {
        name: "Sun Life Premier",
        tier: "Gold",
        employee_cost: 45,
        employer_cost: 140,
        coverage: {
          health: { drugs: "100% up to $5,000/yr", paramedical: "$1,000/yr", hospital: "Private (where available)" },
          dental: { basic: "90% up to $2,250/yr", major: "60% up to $1,750/yr", ortho: "50% up to $2,500 lifetime" },
          vision: { exam: "Annually", glasses_contacts: "$450/24 mo" },
          life: { employee: "$100,000" },
          disability: { std: "Yes (66.7%)", ltd: "Yes (60%)" },
          travel: "Emergency $5M, 45 days"
        }
      }
    ]
  },
  {
    provider: "Manulife",
    plans: [
      {
        name: "Manulife Essentials",
        tier: "Bronze",
        employee_cost: 23,
        employer_cost: 82,
        coverage: {
          health: { drugs: "80% up to $2,000/yr", paramedical: "$300/yr", hospital: "Semi-private" },
          dental: { basic: "70% up to $1,000/yr", major: "—" },
          vision: { exam: "Every 2 years", glasses_contacts: "$200/24 mo" },
          life: { employee: "$25,000" },
          travel: "Emergency $1M, 15 days"
        }
      },
      {
        name: "Manulife Plus",
        tier: "Silver",
        employee_cost: 31,
        employer_cost: 98,
        coverage: {
          health: { drugs: "90% up to $3,000/yr", paramedical: "$500/yr", hospital: "Semi-private" },
          dental: { basic: "80% up to $1,500/yr", major: "50% up to $1,000/yr" },
          vision: { exam: "Annually", glasses_contacts: "$300/24 mo" },
          life: { employee: "$50,000" },
          disability: { std: "Yes (66.7%)" },
          travel: "Emergency $2M, 30 days"
        }
      }
    ]
  },
  {
    provider: "Canada Life",
    plans: [
      {
        name: "Canada Life Advantage",
        tier: "Silver",
        employee_cost: 32,
        employer_cost: 102,
        coverage: {
          health: { drugs: "90% up to $3,500/yr", paramedical: "$600/yr", hospital: "Semi-private" },
          dental: { basic: "80% up to $1,500/yr", major: "50% up to $1,250/yr" },
          vision: { exam: "Annually", glasses_contacts: "$300/24 mo" },
          life: { employee: "$50,000" },
          disability: { std: "Yes (66.7%)" },
          travel: "Emergency $2M, 30 days"
        }
      }
    ]
  },
  {
    provider: "Green Shield Canada",
    plans: [
      {
        name: "GSC Choice",
        tier: "Bronze",
        employee_cost: 21,
        employer_cost: 76,
        coverage: {
          health: { drugs: "80% up to $2,000/yr", paramedical: "$250/yr", hospital: "Semi-private" },
          dental: { basic: "70% up to $900/yr", major: "—" },
          vision: { exam: "Every 2 years", glasses_contacts: "$200/24 mo" },
          life: { employee: "$25,000" },
          travel: "Emergency $1M, 15 days"
        }
      }
    ]
  },
  {
    provider: "Desjardins",
    plans: [
      {
        name: "Desjardins Complete",
        tier: "Gold",
        employee_cost: 43,
        employer_cost: 135,
        coverage: {
          health: { drugs: "100% up to $5,000/yr", paramedical: "$800/yr", hospital: "Private (where available)" },
          dental: { basic: "90% up to $2,000/yr", major: "60% up to $1,500/yr", ortho: "50% up to $2,000 lifetime" },
          vision: { exam: "Annually", glasses_contacts: "$400/24 mo" },
          life: { employee: "$100,000" },
          disability: { std: "Yes (66.7%)", ltd: "Yes (60%)" },
          travel: "Emergency $5M, 45 days"
        }
      }
    ]
  }
];

// ---------- Component ----------
export default function AdminBenefits() {
  const [plans, setPlans] = React.useState<PlanRow[]>([]);
  const [employees, setEmployees] = React.useState<EmployeeRow[]>([]);
  const [assignEmpId, setAssignEmpId] = React.useState<string>("");
  const [assignPlanId, setAssignPlanId] = React.useState<string>("");
  const [effective, setEffective] = React.useState<string>("");
  const [note, setNote] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  async function loadData() {
    setLoading(true);
    setNote(null);

    const [{ data: planData, error: planErr }, { data: empData, error: empErr }] = await Promise.all([
      supabase.from("benefits_plans").select("*").order("created_at", { ascending: false }),
      supabase.from("employees").select("id, first_name, last_name, personal_email").order("first_name")
    ]);

    if (planErr) setNote(`Load plans failed: ${planErr.message}`);
    else setPlans((planData ?? []) as PlanRow[]);

    if (empErr) setNote((prev) => (prev ? prev + " • " : "") + `Load employees failed: ${empErr.message}`);
    else setEmployees((empData ?? []) as EmployeeRow[]);

    setLoading(false);
  }

  React.useEffect(() => {
    loadData();
  }, []);

  async function addTemplate(t: (typeof PLAN_TEMPLATES)[number]["plans"][number], provider: string) {
    setNote(null);
    const { error } = await supabase.from("benefits_plans").insert([
      {
        provider,
        name: t.name,
        tier: t.tier,
        coverage: t.coverage,
        employee_cost: t.employee_cost,
        employer_cost: t.employer_cost,
        active: true
      }
    ]);
    if (error) {
      setNote(`Add plan failed: ${error.message}`);
    } else {
      setNote(`Added "${t.name}" from ${provider}.`);
      await loadData();
    }
  }

  async function assignPlan() {
    if (!assignEmpId || !assignPlanId) {
      setNote("Select employee and plan.");
      return;
    }
    const { error } = await supabase.from("employee_benefits").insert([
      {
        employee_id: assignEmpId,
        plan_id: assignPlanId,
        effective_date: effective || new Date().toISOString().slice(0, 10),
        status: "active"
      }
    ]);
    if (error) setNote(`Assign failed: ${error.message}`);
    else setNote("Plan assigned.");
  }

  return (
    <div className="space-y-6">
      {/* Templates catalog */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Add Benefits Package (Provider Templates)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {PLAN_TEMPLATES.map((group) => (
            <div key={group.provider} className="rounded-md border p-3">
              <div className="font-medium mb-2">{group.provider}</div>
              <div className="grid md:grid-cols-3 gap-3">
                {group.plans.map((p) => (
                  <Card key={p.name} className="border">
                    <CardHeader>
                      <CardTitle className="text-sm">{p.name} <Badge className="ml-2">{p.tier}</Badge></CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div><strong>Employee:</strong> {CAD(p.employee_cost)} / pay</div>
                      <div><strong>Employer:</strong> {CAD(p.employer_cost)} / pay</div>
                      <Separator />
                      <div><strong>Health (Drugs):</strong> {p.coverage.health.drugs}</div>
                      <div><strong>Paramedical:</strong> {p.coverage.health.paramedical}</div>
                      <div><strong>Dental:</strong> {p.coverage.dental.basic}{p.coverage.dental.major !== "—" ? `; Major ${p.coverage.dental.major}` : ""}</div>
                      <div><strong>Vision:</strong> {p.coverage.vision.glasses_contacts}</div>
                      <Button className="mt-2 w-full" onClick={() => addTemplate(p, group.provider)}>
                        Add to Company Plans
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Current company plans */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Heart className="w-4 h-4" />
            Company Plans
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-gray-600">Loading…</div>
          ) : plans.length === 0 ? (
            <div className="text-sm text-gray-600">No plans yet. Add from templates above.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Employer</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.provider}</TableCell>
                    <TableCell>{p.name}</TableCell>
                    <TableCell>{p.tier ?? "—"}</TableCell>
                    <TableCell>{p.employee_cost != null ? CAD(p.employee_cost) : "—"}</TableCell>
                    <TableCell>{p.employer_cost != null ? CAD(p.employer_cost) : "—"}</TableCell>
                    <TableCell>
                      {p.active ? (
                        <Badge className="bg-green-600 hover:bg-green-600">active</Badge>
                      ) : (
                        <Badge variant="secondary">inactive</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Assign plan to employee */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Assign Plan to Employee</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {note && <div className="rounded border border-blue-200 bg-blue-50 p-2 text-xs text-blue-900">{note}</div>}

          <div className="grid md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <div className="text-xs text-gray-600">Employee</div>
              <Select value={assignEmpId} onValueChange={setAssignEmpId}>
                <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {[e.first_name, e.last_name].filter(Boolean).join(" ") || e.email || e.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <div className="text-xs text-gray-600">Plan</div>
              <Select value={assignPlanId} onValueChange={setAssignPlanId}>
                <SelectTrigger><SelectValue placeholder="Select plan" /></SelectTrigger>
                <SelectContent>
                  {plans.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.provider} — {p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <div className="text-xs text-gray-600">Effective date</div>
              <Input type="date" value={effective} onChange={(e) => setEffective(e.target.value)} />
            </div>
          </div>

          <Button className="mt-2" onClick={assignPlan}>Assign</Button>
        </CardContent>
      </Card>
    </div>
  );
}

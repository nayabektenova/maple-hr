"use client";

import * as React from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Shield, Heart } from "lucide-react";

// ---------------- Types ----------------
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
  description?: string | null;
};

type EmployeeRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  personal_email: string | null;
};

const CAD = (n: number) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(n ?? 0);

// ---------------- Plan Templates ----------------
const PLAN_TEMPLATES = [
  {
    provider: "Sun Life Financial",
    plans: [
      {
        plan_code: "SL-BASIC-IND",
        plan_name: "Basic Health Plan",
        name: "Basic Health",
        tier: "Individual",
        coverage: {
          dental: "80% basic services, 50% major services up to $1,500/year",
          vision: "Eye exams every 24 months, $200 for frames/lenses",
          prescription_drugs: "80% coverage, $10 deductible",
          paramedical: "$500/year for chiropractor, physiotherapy, massage",
          hospital: "Semi-private room",
          medical_equipment: "80% up to $2,000"
        },
        employee_cost: 45.00,
        employer_cost: 135.00
      },
      {
        plan_code: "SL-ENHANCED-IND",
        plan_name: "Enhanced Health Plan",
        name: "Enhanced Health",
        tier: "Individual",
        coverage: {
          dental: "100% basic services, 80% major services up to $2,000/year",
          vision: "Eye exams every 12 months, $300 for frames/lenses",
          prescription_drugs: "90% coverage, $5 deductible",
          paramedical: "$750/year for chiropractor, physiotherapy, massage, psychologist",
          hospital: "Private room",
          medical_equipment: "90% up to $3,000",
          travel_insurance: "$1,000,000 emergency medical"
        },
        employee_cost: 75.00,
        employer_cost: 225.00
      },
      {
        plan_code: "SL-FAMILY-PLUS",
        plan_name: "Family Health Plus Plan",
        name: "Family Health Plus",
        tier: "Family",
        coverage: {
          dental: "100% basic services, 80% major services up to $2,500/family",
          vision: "Eye exams every 12 months, $400 for frames/lenses per person",
          prescription_drugs: "100% coverage, no deductible",
          paramedical: "$1,000/year per person for various therapies",
          hospital: "Private room",
          medical_equipment: "100% up to $5,000/family",
          travel_insurance: "$5,000,000 emergency medical",
          orthodontics: "50% up to $2,500 lifetime"
        },
        employee_cost: 150.00,
        employer_cost: 450.00
      }
    ]
  },
  {
    provider: "Canada Life",
    plans: [
      {
        plan_code: "CL-STD-IND",
        plan_name: "Standard Group Benefits Plan",
        name: "Standard Group Benefits",
        tier: "Individual",
        coverage: {
          dental: "80% basic services, 50% major services up to $1,000/year",
          vision: "Eye exams every 24 months, $150 for frames/lenses",
          prescription_drugs: "80% coverage, $15 deductible",
          paramedical: "$400/year for chiropractor, physiotherapy",
          hospital: "Standard ward",
          accidental_death: "$50,000"
        },
        employee_cost: 40.00,
        employer_cost: 120.00
      },
      {
        plan_code: "CL-COMP-FAM",
        plan_name: "Comprehensive Care Plan",
        name: "Comprehensive Care",
        tier: "Family",
        coverage: {
          dental: "100% basic services, 80% major services up to $2,000/family",
          vision: "Eye exams every 12 months, $250 for frames/lenses",
          prescription_drugs: "90% coverage, $10 deductible",
          paramedical: "$600/year per person for various therapies",
          hospital: "Semi-private room",
          wellness: "$300/year for gym membership, fitness equipment",
          mental_health: "$1,000/year for psychologist services"
        },
        employee_cost: 120.00,
        employer_cost: 360.00
      }
    ]
  },
  {
    provider: "Manulife",
    plans: [
      {
        plan_code: "MAN-CORE-IND",
        plan_name: "Core Health Solutions Plan",
        name: "Core Health Solutions",
        tier: "Individual",
        coverage: {
          dental: "80% preventive care, 50% restorative up to $1,200/year",
          vision: "Eye exams every 24 months, $175 for glasses/contacts",
          prescription_drugs: "80% coverage, $20 deductible",
          paramedical: "$350/year for registered practitioners",
          hospital: "Standard accommodation",
          emergency_services: "100% coverage"
        },
        employee_cost: 42.00,
        employer_cost: 126.00
      },
      {
        plan_code: "MAN-PLAT-FAM",
        plan_name: "Platinum Coverage Plan",
        name: "Platinum Coverage",
        tier: "Family",
        coverage: {
          dental: "100% preventive, 80% major services up to $3,000/family",
          vision: "Eye exams every 12 months, $500 for vision care per person",
          prescription_drugs: "100% coverage, no deductible",
          paramedical: "$1,200/year per person for various therapies",
          hospital: "Private room fully covered",
          travel_insurance: "$2,000,000 emergency medical",
          orthodontics: "50% up to $3,000 lifetime per child",
          hearing_aids: "$1,000 every 48 months"
        },
        employee_cost: 180.00,
        employer_cost: 540.00
      }
    ]
  },
  {
    provider: "Blue Cross",
    plans: [
      {
        plan_code: "BC-BASIC-IND",
        plan_name: "Basic Blue Plan",
        name: "Basic Blue",
        tier: "Individual",
        coverage: {
          dental: "80% basic services up to $1,000/year",
          vision: "Eye exams every 24 months, $100 for vision care",
          prescription_drugs: "80% coverage, $25 deductible",
          paramedical: "$300/year for select services",
          hospital: "Standard ward",
          ambulance: "100% coverage"
        },
        employee_cost: 38.00,
        employer_cost: 114.00
      },
      {
        plan_code: "BC-ADV-FAM",
        plan_name: "Blue Advantage Plan",
        name: "Blue Advantage",
        tier: "Family",
        coverage: {
          dental: "100% preventive, 80% basic services up to $1,800/family",
          vision: "Eye exams every 12 months, $300 for vision care per person",
          prescription_drugs: "90% coverage, $15 deductible",
          paramedical: "$800/year per person for various therapies",
          hospital: "Semi-private room",
          travel_insurance: "$1,000,000 emergency medical",
          diabetic_supplies: "100% coverage"
        },
        employee_cost: 135.00,
        employer_cost: 405.00
      },
      {
        plan_code: "BC-PREM-IND",
        plan_name: "Blue Premier Plan",
        name: "Blue Premier",
        tier: "Individual",
        coverage: {
          dental: "100% preventive, 80% major services up to $2,000/year",
          vision: "Eye exams every 12 months, $400 for frames/lenses",
          prescription_drugs: "100% coverage, $10 deductible",
          paramedical: "$1,000/year for various therapies",
          hospital: "Private room",
          travel_insurance: "$2,000,000 emergency medical",
          mental_health: "$2,000/year for counseling services"
        },
        employee_cost: 85.00,
        employer_cost: 255.00
      }
    ]
  },
  {
    provider: "Desjardins",
    plans: [
      {
        plan_code: "DESJ-ESS-IND",
        plan_name: "Essential Health Plan",
        name: "Essential Health",
        tier: "Individual",
        coverage: {
          dental: "80% basic services up to $800/year",
          vision: "Eye exams every 24 months, $125 for vision care",
          prescription_drugs: "80% coverage, $20 deductible",
          paramedical: "$250/year for chiropractor and physiotherapy",
          hospital: "Standard accommodation",
          medical_services: "100% for medically necessary services"
        },
        employee_cost: 35.00,
        employer_cost: 105.00
      },
      {
        plan_code: "DESJ-FAM-SEC",
        plan_name: "Family Secure Plan",
        name: "Family Secure",
        tier: "Family",
        coverage: {
          dental: "100% preventive, 80% basic services up to $2,200/family",
          vision: "Eye exams every 12 months, $350 per person",
          prescription_drugs: "90% coverage, $10 deductible",
          paramedical: "$900/year per person for various therapies",
          hospital: "Semi-private room",
          critical_illness: "$25,000 coverage",
          health_spending_account: "$500/year"
        },
        employee_cost: 140.00,
        employer_cost: 420.00
      }
    ]
  },
  {
    provider: "Industrial Alliance",
    plans: [
      {
        plan_code: "IA-BASIC-IND",
        plan_name: "iA Basic Group Plan",
        name: "iA Basic Group",
        tier: "Individual",
        coverage: {
          dental: "80% preventive care up to $900/year",
          vision: "Eye exams every 24 months, $100 for glasses",
          prescription_drugs: "80% coverage, $25 deductible",
          paramedical: "$200/year for select services",
          hospital: "Standard ward",
          emergency_transport: "100% coverage"
        },
        employee_cost: 32.00,
        employer_cost: 96.00
      },
      {
        plan_code: "IA-COMP-FAM",
        plan_name: "iA Comprehensive Plan",
        name: "iA Comprehensive",
        tier: "Family",
        coverage: {
          dental: "100% preventive, 80% basic services up to $2,000/family",
          vision: "Eye exams every 12 months, $300 per person",
          prescription_drugs: "90% coverage, $15 deductible",
          paramedical: "$700/year per person",
          hospital: "Semi-private room",
          travel_assistance: "24/7 emergency travel service",
          wellness_program: "$200/year for health activities"
        },
        employee_cost: 125.00,
        employer_cost: 375.00
      }
    ]
  }
];
// -------------- Component --------------
export default function AdminBenefitsSimple() {
  const [plans, setPlans] = React.useState<PlanRow[]>([]);
  const [employees, setEmployees] = React.useState<EmployeeRow[]>([]);
  const [assignEmpId, setAssignEmpId] = React.useState<string>("");
  const [assignPlanId, setAssignPlanId] = React.useState<string>("");
  const [effective, setEffective] = React.useState<string>("");
  const [note, setNote] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [seeding, setSeeding] = React.useState(false);
  const [authError, setAuthError] = React.useState(false);

  // Check authentication
  async function checkAuth() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        setAuthError(true);
        setNote("Please sign in to access admin features");
        setLoading(false);
        return false;
      }
      return true;
    } catch (error) {
      setAuthError(true);
      setNote("Authentication check failed");
      setLoading(false);
      return false;
    }
  }

  // Handle JWT expiration with retry
  async function handleJWTError(operation: string, error: any): Promise<boolean> {
    if (error?.message?.includes('JWT') || error?.message?.includes('expired')) {
      console.log(`JWT expired during ${operation}, attempting refresh...`);
      
      // Try to refresh the session
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        setNote("Session expired. Please refresh the page or sign in again.");
        setAuthError(true);
        return false;
      } else {
        setNote("Session refreshed, retrying...");
        return true; // Successfully refreshed, should retry
      }
    }
    return false; // Not a JWT error
  }

  // ---- Seed all templates into DB if missing (provider+name+tier) ----
  async function seedAllTemplatesIfMissing() {
    setSeeding(true);
    try {
      const isAuthenticated = await checkAuth();
      if (!isAuthenticated) return;

      // Pull all existing plans once
      const { data: existing, error: exErr } = await supabase
        .from("benefits_plans")
        .select("id, provider, name, tier");

      if (exErr) {
        const shouldRetry = await handleJWTError("seed check", exErr);
        if (shouldRetry) {
          await seedAllTemplatesIfMissing();
          return;
        }
        throw exErr;
      }

      const key = (p: { provider: string; name: string; tier?: string | null }) =>
        `${p.provider}|||${p.name}|||${p.tier ?? ""}`;

      const existingKeys = new Set(
        (existing ?? []).map((p: any) => key({ provider: p.provider, name: p.name, tier: p.tier }))
      );

      const inserts: any[] = [];
      PLAN_TEMPLATES.forEach((group) => {
        group.plans.forEach((tpl) => {
          const k = key({ provider: group.provider, name: tpl.name, tier: tpl.tier });
          if (!existingKeys.has(k)) {
            inserts.push({
              provider: group.provider,
              name: tpl.name,
              tier: tpl.tier,
              coverage: tpl.coverage,
              employee_cost: tpl.employee_cost,
              employer_cost: tpl.employer_cost,
              premium_employee: tpl.employee_cost,
              premium_employer: tpl.employer_cost,
              active: true,
              description: `Comprehensive ${tpl.tier?.toLowerCase() || 'individual'} health coverage from ${group.provider}`,
            });
          }
        });
      });

      if (inserts.length > 0) {
        const { error: insErr } = await supabase.from("benefits_plans").insert(inserts);
        if (insErr) {
          const shouldRetry = await handleJWTError("seed insert", insErr);
          if (shouldRetry) {
            await seedAllTemplatesIfMissing();
            return;
          }
          throw insErr;
        }
        setNote(`Successfully seeded ${inserts.length} new plans from ${PLAN_TEMPLATES.length} providers`);
      } else {
        setNote("All plans are already seeded in the database");
      }
    } catch (e: any) {
      setNote(`Seeding failed: ${e.message || e.toString()}`);
    } finally {
      setSeeding(false);
    }
  }

  async function loadData() {
    setLoading(true);
    setNote(null);

    const isAuthenticated = await checkAuth();
    if (!isAuthenticated) return;

    try {
      const [{ data: planData, error: planErr }, { data: empData, error: empErr }] = await Promise.all([
        supabase.from("benefits_plans").select("*").order("provider").order("name"),
        supabase.from("employees").select("id, first_name, last_name, personal_email").order("first_name"),
      ]);

      // Handle plan errors with JWT retry
      if (planErr) {
        const shouldRetry = await handleJWTError("load plans", planErr);
        if (shouldRetry) {
          await loadData();
          return;
        }
        throw new Error(`Load plans failed: ${planErr.message}`);
      } else {
        setPlans((planData ?? []) as PlanRow[]);
      }

      // Handle employee errors with JWT retry
      if (empErr) {
        const shouldRetry = await handleJWTError("load employees", empErr);
        if (shouldRetry) {
          await loadData();
          return;
        }
        throw new Error(`Load employees failed: ${empErr.message}`);
      } else {
        setEmployees((empData ?? []) as EmployeeRow[]);
      }

    } catch (error: any) {
      setNote(error.message);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    // Seed then load
    (async () => {
      await seedAllTemplatesIfMissing();
      await loadData();
    })();
  }, []);

async function assignPlan() {
  if (!assignEmpId || !assignPlanId) {
    setNote("Select employee and plan.");
    return;
  }
  setNote(null);

  try {
    // Convert integer ID to UUID format
    const employeeIdStr = assignEmpId.toString();
    const paddedId = employeeIdStr.padStart(12, '0');
    const employeeUUID = `00000000-0000-0000-0000-${paddedId}`;
    
    console.log('Assigning plan to employee:', employeeUUID);

    const { error } = await supabase.from("employee_benefits").insert([
      {
        employee_id: employeeUUID,
        user_id: employeeUUID,
        plan_id: assignPlanId,
        effective_date: effective || new Date().toISOString().split('T')[0],
        effective_from: effective || new Date().toISOString().split('T')[0],
        status: "active",
      },
    ]);

    if (error) {
      console.error('Error:', error);
      setNote(`Assign failed: ${error.message}`);
    } else {
      setNote("✅ Plan assigned successfully!");
      // Clear form
      setAssignEmpId("");
      setAssignPlanId("");
      setEffective("");
      // Refresh data
      await loadData();
    }
  } catch (error: any) {
    console.error('Error:', error);
    setNote(`Assign failed: ${error.message}`);
  }
}

  // Add a sign-in prompt section
  if (authError) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Shield className="w-12 h-12 mx-auto text-gray-400" />
              <h3 className="text-lg font-medium">Authentication Required</h3>
              <p className="text-sm text-gray-600">
                Your session has expired. Please refresh the page or sign in again.
              </p>
              <div className="space-y-2">
                <Button onClick={() => window.location.reload()} className="w-full">
                  Refresh Page
                </Button>
                <Button variant="outline" onClick={() => {
                  setAuthError(false);
                  setLoading(true);
                  loadData();
                }} className="w-full">
                  Retry
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Assign directly from seeded catalog */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Assign Benefits Plan (All Providers)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {note && (
            <div className={`rounded border p-2 text-xs ${
              note.includes("failed") || note.includes("expired") || note.includes("Please sign in")
                ? "border-red-200 bg-red-50 text-red-900"
                : "border-blue-200 bg-blue-50 text-blue-900"
            }`}>
              {note}
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <div className="text-xs text-gray-600">Employee</div>
              <Select value={assignEmpId} onValueChange={setAssignEmpId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((e) => {
                    const label =
                      [e.first_name, e.last_name].filter(Boolean).join(" ") ||
                      e.personal_email ||
                      e.id;
                    return (
                      <SelectItem key={e.id} value={e.id}>
                        {label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <div className="text-xs text-gray-600">Plan</div>
              <Select value={assignPlanId} onValueChange={setAssignPlanId} disabled={loading || seeding}>
                <SelectTrigger>
                  <SelectValue placeholder={seeding ? "Seeding plans…" : loading ? "Loading…" : "Select plan"} />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.provider} — {p.name}{p.tier ? ` (${p.tier})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <div className="text-xs text-gray-600">Effective date</div>
              <Input 
                type="date" 
                value={effective} 
                onChange={(e) => setEffective(e.target.value)}
                placeholder="Select date"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button className="mt-2" onClick={assignPlan} disabled={seeding || loading}>
              Assign
            </Button>
            <Button variant="outline" className="mt-2" onClick={loadData}>
              Refresh
            </Button>
            <Button variant="outline" className="mt-2" onClick={seedAllTemplatesIfMissing} disabled={seeding}>
              {seeding ? "Seeding..." : "Seed Plans"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Read-only catalog (already in DB) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Heart className="w-4 h-4" />
            Company Plans ({plans.length} Plans from {new Set(plans.map(p => p.provider)).size} Providers)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-gray-600">{seeding ? "Seeding provider plans…" : "Loading…"}</div>
          ) : plans.length === 0 ? (
            <div className="text-sm text-gray-600">No plans found. Click "Seed Plans" to add Canadian insurance plans.</div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Provider</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Employee Cost</TableHead>
                    <TableHead>Employer Cost</TableHead>
                    <TableHead>Total Monthly</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.provider}</TableCell>
                      <TableCell>{p.name}</TableCell>
                      <TableCell>
                        <Badge variant={p.tier === 'Family' ? 'default' : 'secondary'}>
                          {p.tier ?? "Individual"}
                        </Badge>
                      </TableCell>
                      <TableCell>{p.employee_cost != null ? CAD(p.employee_cost) : "—"}</TableCell>
                      <TableCell>{p.employer_cost != null ? CAD(p.employer_cost) : "—"}</TableCell>
                      <TableCell className="font-medium">
                        {p.employee_cost != null && p.employer_cost != null 
                          ? CAD(p.employee_cost + p.employer_cost)
                          : "—"
                        }
                      </TableCell>
                      <TableCell>
                        {p.active ? (
                          <Badge className="bg-green-600 hover:bg-green-600">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plan Coverage Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Heart className="w-4 h-4" />
            Plan Coverage Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.slice(0, 6).map((plan) => (
              <div key={plan.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-sm">{plan.provider} - {plan.name}</h3>
                  <Badge variant={plan.tier === 'Family' ? 'default' : 'secondary'} className="text-xs">
                    {plan.tier ?? "Individual"}
                  </Badge>
                </div>
                {plan.coverage && (
                  <div className="space-y-2 text-xs">
                    {Object.entries(plan.coverage).slice(0, 4).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-600 capitalize">{key.replace('_', ' ')}:</span>
                        <span className="font-medium text-right">{value as string}</span>
                      </div>
                    ))}
                    {Object.keys(plan.coverage).length > 4 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{Object.keys(plan.coverage).length - 4} more benefits
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          {plans.length > 6 && (
            <div className="text-center mt-4 text-sm text-gray-600">
              Showing 6 of {plans.length} plans. Use the dropdown above to see all available plans.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
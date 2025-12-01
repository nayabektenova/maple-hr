// components/attrition-analytics.tsx
"use client";

import * as React from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from "@/components/ui/table";

type EmployeeRow = {
  id: string;
  employee_name: string;
  department: string;
  job_role: string;
  gender: string;

  age: number;
  monthly_income: number;
  distance_from_home: number;
  num_companies_worked: number;
  total_working_years: number;
  years_at_company: number;
  years_in_current_role: number;
  years_since_last_promotion: number;
  years_with_curr_manager: number;

  job_satisfaction: number;
  environment_satisfaction: number;
  work_life_balance: number;
  relationship_satisfaction: number;
  job_involvement: number;

  business_travel: string;
  marital_status: string;
  overtime: string; // "Yes" | "No"
};

type RiskResult = {
  risk_percent: number;
  risk_bucket: string;
  reasons: string[];
};

const ATTRITION_API_URL =
  process.env.NEXT_PUBLIC_ATTRITION_API_URL || "http://localhost:8000";

export default function AttritionAnalytics() {
  const supabase = createClientComponentClient();
  const [rows, setRows] = React.useState<EmployeeRow[]>([]);
  const [risk, setRisk] = React.useState<Record<string, RiskResult>>({});
  const [loading, setLoading] = React.useState(false);
  const [predicting, setPredicting] = React.useState(false);

  React.useEffect(() => {
    const load = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("attrition_survey_responses") // ⬅️ NEW TABLE
        .select("*")
        .order("created_at", { ascending: false });

      console.log("ATTRITION SUPABASE RESULT", { data, error });

      if (error) {
        console.error("Error loading attrition_survey_responses", error);
      } else if (data) {
        setRows(data as EmployeeRow[]);
      }

      setLoading(false);
    };

    load();
  }, [supabase]);

  const runPredictions = async () => {
    if (rows.length === 0) return;

    setPredicting(true);
    const next: Record<string, RiskResult> = {};

    for (const emp of rows) {
      try {
        const res = await fetch(`${ATTRITION_API_URL}/predict`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            Age: emp.age,
            MonthlyIncome: emp.monthly_income,
            DistanceFromHome: emp.distance_from_home,
            NumCompaniesWorked: emp.num_companies_worked,
            TotalWorkingYears: emp.total_working_years,
            YearsAtCompany: emp.years_at_company,
            YearsInCurrentRole: emp.years_in_current_role,
            YearsSinceLastPromotion: emp.years_since_last_promotion,
            YearsWithCurrManager: emp.years_with_curr_manager,
            EnvironmentSatisfaction: emp.environment_satisfaction,
            JobSatisfaction: emp.job_satisfaction,
            WorkLifeBalance: emp.work_life_balance,
            RelationshipSatisfaction: emp.relationship_satisfaction,
            JobInvolvement: emp.job_involvement,
            Department: emp.department,
            JobRole: emp.job_role,
            BusinessTravel: emp.business_travel,
            MaritalStatus: emp.marital_status,
            OverTime: emp.overtime,
            Gender: emp.gender,
          }),
        });

        if (!res.ok) throw new Error(`Attrition API error: ${res.status}`);

        const json = (await res.json()) as RiskResult;
        next[emp.id] = json;
      } catch (err) {
        console.error("Prediction failed for employee", emp.id, err);
      }
    }

    setRisk(next);
    setPredicting(false);
  };

  const riskBuckets = React.useMemo(() => {
    const counts = { High: 0, Medium: 0, Low: 0 };
    Object.values(risk).forEach((r) => {
      if (r.risk_bucket === "High") counts.High += 1;
      else if (r.risk_bucket === "Medium") counts.Medium += 1;
      else if (r.risk_bucket === "Low") counts.Low += 1;
    });
    return counts;
  }, [risk]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Attrition Risk Analytics</h1>
          <p className="text-sm text-gray-600 max-w-xl">
            Predicts resignation risk from the IBM HR model, using Maple HR
            employee-like records and engagement survey-style responses.
          </p>
        </div>
        <Button
          onClick={runPredictions}
          disabled={predicting || rows.length === 0}
        >
          {predicting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {predicting ? "Calculating..." : "Run predictions"}
        </Button>
      </div>

      {Object.keys(risk).length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-lg border bg-white p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              High Risk
            </p>
            <p className="mt-1 text-2xl font-semibold text-red-600">
              {riskBuckets.High}
            </p>
          </div>
          <div className="rounded-lg border bg-white p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Medium Risk
            </p>
            <p className="mt-1 text-2xl font-semibold text-amber-500">
              {riskBuckets.Medium}
            </p>
          </div>
          <div className="rounded-lg border bg-white p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Low Risk
            </p>
            <p className="mt-1 text-2xl font-semibold text-emerald-600">
              {riskBuckets.Low}
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12 text-gray-500">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading employees…
        </div>
      ) : rows.length === 0 ? (
        <div className="py-8 text-center text-gray-500">
          No employees found with survey data.
        </div>
      ) : (
        <div className="border rounded-lg bg-white overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Risk</TableHead>
                <TableHead>Reasons</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((emp) => {
                const r = risk[emp.id];
                return (
                  <TableRow key={emp.id}>
                    <TableCell>{emp.employee_name}</TableCell>
                    <TableCell>{emp.department}</TableCell>
                    <TableCell>{emp.job_role}</TableCell>
                    <TableCell>
                      {r ? (
                        <span
                          className={
                            r.risk_bucket === "High"
                              ? "font-semibold text-red-600"
                              : r.risk_bucket === "Medium"
                              ? "font-semibold text-amber-600"
                              : "font-semibold text-emerald-600"
                          }
                        >
                          {r.risk_percent.toFixed(1)}% ({r.risk_bucket})
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">
                          Not calculated
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {r ? (
                        <ul className="list-disc list-inside text-xs text-gray-700">
                          {r.reasons.map((reason, idx) => (
                            <li key={idx}>{reason}</li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-gray-400 text-sm">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

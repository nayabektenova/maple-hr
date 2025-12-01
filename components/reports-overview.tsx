"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as ReTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { supabase } from "@/lib/supabaseClient";

// Map raw `current_contract` values from DB to display buckets.
// Add/adjust keys on the left to match your actual strings in the table.
const CONTRACT_BUCKETS: Record<string, string> = {
  // Full-time / Permanent
  "full-time": "Full-time / Permanent",
  "full_time": "Full-time / Permanent",
  "permanent": "Full-time / Permanent",
  "fte": "Full-time / Permanent",

  // Remote / Hybrid (keep here IF your data stores it in current_contract)
  "remote": "Remote / Hybrid",
  "hybrid": "Remote / Hybrid",
  "wfh": "Remote / Hybrid",

  // Contract / Freelance
  "contract": "Contract / Freelance",
  "freelance": "Contract / Freelance",
  "contractor": "Contract / Freelance",

  // Part-time
  "part-time": "Part-time",
  "part_time": "Part-time",
  "pt": "Part-time",

  // Internship
  "intern": "Internship",
  "internship": "Internship",

  // Temporary / Agency
  "temporary": "Temporary / Agency",
  "temp": "Temporary / Agency",
  "agency": "Temporary / Agency",
};

// palette 
const PIE_COLORS = ["#34d399", "#a78bfa", "#f59e0b", "#60a5fa", "#f97316", "#86efac"];

function SectionCard({
  title,
  children,
  rightLabel,
  className,
}: {
  title: string;
  children: React.ReactNode;
  rightLabel?: string;
  className?: string;
}) {
  const [month, setMonth] = useState(rightLabel ?? "July 2025");
  return (
    <div className={cn("bg-white rounded-xl border border-gray-200 p-4 sm:p-6", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        
      </div>
      {children}
    </div>
  );
}

function LegendList({ items }: { items: { name: string; color: string }[] }) {
  return (
    <ul className="mt-4 grid grid-cols-2 gap-2 text-sm">
      {items.map((it) => (
        <li key={it.name} className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full" style={{ background: it.color }} />
          <span className="text-gray-700">{it.name}</span>
        </li>
      ))}
    </ul>
  );
}

type EmployeeRow = {
  id: string;
  department: string | null;
  current_contract: string | null; 
};

export function ReportsOverview() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [rows, setRows] = useState<EmployeeRow[]>([]);

  useEffect(() => {
    let ok = true;
    (async () => {
      setLoading(true);
      setErr(null);

      const { data, error } = await supabase
        .from("employees")
        .select("id, department, current_contract");

      if (!ok) return;

      if (error) {
        setErr(error.message);
        setRows([]);
      } else {
        setRows((data as EmployeeRow[]) || []);
      }
      setLoading(false);
    })();

    return () => {
      ok = false;
    };
  }, []);

  const norm = (v?: string | null) => (v ?? "").toString().trim().toLowerCase();

  // Employment Types (from current_contract)
  const employmentTypes = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of rows) {
      const key = CONTRACT_BUCKETS[norm(r.current_contract)] ?? "Other";
      counts[key] = (counts[key] || 0) + 1;
    }
    const order = [
      "Full-time / Permanent",
      "Remote / Hybrid",
      "Contract / Freelance",
      "Part-time",
      "Internship",
      "Temporary / Agency",
      "Other",
    ];
    return order
      .filter((k) => counts[k] > 0)
      .map((k) => ({ name: k, value: counts[k] }));
  }, [rows]);

  // Employees by Department
  const byDepartment = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of rows) {
      const dept = (r.department ?? "Unassigned").trim() || "Unassigned";
      counts[dept] = (counts[dept] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([name, employees]) => ({ name, employees }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [rows]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-gray-100 rounded" />
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="h-80 bg-gray-100 rounded-xl" />
          <div className="h-80 bg-gray-100 rounded-xl" />
        </div>
        <div className="h-96 bg-gray-100 rounded-xl" />
      </div>
    );
  }

  if (err) {
    return (
      <div className="p-4 border rounded-xl bg-red-50 text-red-700">
        Failed to load reports: {err}
      </div>
    );
  }

  const noEmployees = rows.length === 0;

  // Totals for % tooltips
  const totalEmp = employmentTypes.reduce((s, d) => s + d.value, 0);

  return (
    <div className="space-y-6">
      {/* Employment Types (from current_contract) */}
      <SectionCard title="Employment Types" rightLabel="July 2025">
        {noEmployees ? (
          <div className="text-sm text-gray-500">No employees found.</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6 items-center">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={employmentTypes}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {employmentTypes.map((_, idx) => (
                      <Cell key={`cell-et-${idx}`} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <ReTooltip
                    formatter={(val: number, _n: string, entry: any) => {
                      const pct = totalEmp ? ((val / totalEmp) * 100).toFixed(1) + "%" : "—";
                      return [`${val} (${pct})`, entry?.name];
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <LegendList
              items={employmentTypes.map((d, i) => ({
                name: d.name,
                color: PIE_COLORS[i % PIE_COLORS.length],
              }))}
            />
          </div>
        )}
      </SectionCard>

      {/* Employees by Department */}
      <SectionCard title="Employees by Department">
        {noEmployees ? (
          <div className="text-sm text-gray-500">No employees found.</div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byDepartment} barCategoryGap={24}>
                <CartesianGrid vertical={false} stroke="#e5e7eb" />
                <XAxis
                  dataKey="name"
                  tickMargin={8}
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                  axisLine={{ stroke: "#e5e7eb" }}
                />
                <YAxis
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                  axisLine={{ stroke: "#e5e7eb" }}
                  tickLine={{ stroke: "#e5e7eb" }}
                />
                <ReTooltip />
                <Bar dataKey="employees" radius={[6, 6, 0, 0]} fill="#34d399" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

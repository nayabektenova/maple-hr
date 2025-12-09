// components/employee-hierarchy.tsx
// there is some of the code like making the tree structure and svg connectors that is a bit long
// so I added comments to explain those parts and broke them into smaller components
// also added a custom select component for better styling which is helped by copilot


"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase, fetchEmployeesWithRoles, type EmployeeWithRole } from "@/lib/supabaseClient";
import { AlertCircle, RefreshCw } from "lucide-react";

const CustomSelect = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <div className="relative inline-block">
    <select
      {...props}
      className="px-3 py-2 pr-8 border border-gray-300 rounded-md text-sm appearance-none bg-white"
    />
    <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 text-xs">
      ▼
    </span>
  </div>
);

export default function EmployeeHierarchy() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [employees, setEmployees] = useState<EmployeeWithRole[]>([]);
  const [department, setDepartment] = useState<string>("");
  const [departments, setDepartments] = useState<string[]>([]);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    loadEmployees();

    const subscription = supabase
      .channel("employees_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "employees" },
        () => {
          console.log("Employees changed, refreshing...");
          loadEmployees();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function loadEmployees() {
    try {
      setLoading(true);
      setError(null);

      const data = await fetchEmployeesWithRoles();
      setEmployees(data);

      const depts = Array.from(
        new Set(data.map((e) => e.department).filter(Boolean))
      ).sort();
      setDepartments(depts);

      if (depts.length > 0 && !department) {
        setDepartment(depts[0]);
      }

      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load employees");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const deptEmployees = useMemo(
    () => employees.filter((e) => e.department === department),
    [employees, department]
  );

  const getEmployeesByRole = (roleName: string) => {
    return deptEmployees.filter(
      (e) => e.role?.name.toLowerCase() === roleName.toLowerCase()
    );
  };

  const managers = getEmployeesByRole("Manager");
  const assistantManagers = getEmployeesByRole("Assistant Manager");
  const supervisors = getEmployeesByRole("Supervisor");

  const staff = deptEmployees.filter((e) => {
    const roleName = e.role?.name || "";
    return (
      !roleName.toLowerCase().includes("manager") &&
      !roleName.toLowerCase().includes("supervisor") &&
      !roleName.toLowerCase().includes("admin")
    );
  });

  const Box = ({ e }: { e?: EmployeeWithRole | null }) => {
    if (!e) {
      return (
        <div className="min-w-[220px] max-w-[260px] text-center py-4 px-6 border border-gray-200 rounded-md bg-white">
          <div className="text-sm text-gray-500">Not assigned</div>
        </div>
      );
    }

    const name = `${e.first_name} ${e.last_name}`.trim() || "Unnamed";
    const role = e.role?.name || "Unknown";
    const position = e.position || "—";

    return (
      <div className="min-w-[220px] max-w-[260px] text-center py-4 px-6 border-2 border-green-300 rounded-md bg-white shadow-sm hover:shadow-md transition-shadow">
        <div className="font-semibold text-gray-900 text-sm">{name}</div>
        <div className="text-gray-800 text-sm mt-1">{role}</div>
        <div className="text-gray-700 text-xs mt-1">{position}</div>
      </div>
    );
  };

  const VerticalGap = ({ height = 32 }: { height?: number }) => (
    <div className="flex justify-center" aria-hidden>
      <svg width="2" height={height} viewBox={`0 0 2 ${height}`} preserveAspectRatio="none">
        <line x1="1" y1="0" x2="1" y2={height} stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );

  const BranchToStaff = ({ count = 1 }: { count: number }) => {
    const minWidth = 360;
    const per = 160;
    const width = Math.max(minWidth, Math.max(1, count) * per);
    const height = 48;
    const verticalToHorizontal = 8;
    const hY = verticalToHorizontal + 6;
    const padding = 24;
    const usable = width - padding * 2;
    const xs = Array.from({ length: count }).map((_, i) =>
      Math.round(padding + (i + 0.5) * (usable / count))
    );

    return (
      <div className="w-full flex justify-center pointer-events-none" aria-hidden>
        <svg
          width="100%"
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="xMidYMid meet"
        >
          <line
            x1={width / 2}
            y1="0"
            x2={width / 2}
            y2={verticalToHorizontal}
            stroke="#cbd5e1"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            x1={padding}
            y1={hY}
            x2={width - padding}
            y2={hY}
            stroke="#e2e8f0"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {xs.map((x, idx) => (
            <line
              key={idx}
              x1={x}
              y1={hY}
              x2={x}
              y2={hY + 14}
              stroke="#cbd5e1"
              strokeWidth="2"
              strokeLinecap="round"
            />
          ))}
          <line
            x1={width / 2}
            y1={verticalToHorizontal}
            x2={width / 2}
            y2={hY}
            stroke="#cbd5e1"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>
    );
  };

  if (loading && employees.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center space-y-2">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-green-600" />
          <p className="text-sm text-gray-500">Loading hierarchy…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 text-red-600 flex gap-2">
        <AlertCircle className="h-5 w-5 flex-shrink-0" />
        <div>
          <div className="font-medium">Error</div>
          <div className="text-sm">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <CustomSelect value={department} onChange={(e) => setDepartment(e.target.value)}>
            {departments.length === 0 && <option value="">No departments</option>}
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </CustomSelect>
          <span className="ml-2 text-sm font-medium text-gray-700">Department</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadEmployees()}
            className="p-2 hover:bg-gray-100 rounded-md transition"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <div className="text-xs text-gray-500">
            Last refresh: {lastRefresh.toLocaleTimeString()}
          </div>
        </div>
      </div>

      <div className="p-8">
        {department ? (
          <div className="flex flex-col items-center w-full space-y-6">
            <div className="flex flex-col items-center">
              <Box e={managers[0] || null} />
            </div>

            <VerticalGap height={28} />

            <div className="flex flex-col items-center">
              <Box e={assistantManagers[0] || null} />
            </div>

            <VerticalGap height={28} />

            <div className="flex flex-col items-center">
              <Box e={supervisors[0] || null} />
            </div>

            <BranchToStaff count={Math.max(1, staff.length || 1)} />

            <div className="w-full flex justify-center">
              {staff.length > 0 ? (
                <div className="flex flex-wrap gap-6 justify-center mt-4">
                  {staff.map((s) => (
                    <div key={s.id} className="flex justify-center">
                      <Box e={s} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500 mt-2">No staff for this department</div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-6 text-sm text-gray-500">Please select a department to view the hierarchy.</div>
        )}
      </div>
    </div>
  );
}
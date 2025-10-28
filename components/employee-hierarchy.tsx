// components/employee-hierarchy.tsx
// there is some of the code like making the tree structure and svg connectors that is a bit long
// so I added comments to explain those parts and broke them into smaller components
// also added a custom select component for better styling which is helped by copilot


"use client"

import { useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabaseClient"

// ---- Types ----
type EmployeeRow = {
  id: string
  first_name: string | null
  last_name: string | null
  department: string | null
  position: string | null
  role: string | null
}

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
)

/**
 * EmployeeHierarchy
 * - Single department select
 * - Renders Manager -> Assistant Manager -> Supervisor -> Staff
 * - Boxes show: Name, Role, Position (darker & bolder)
 * - Decorative SVG lines connect levels
 */
// ======================= Component ========================
export default function EmployeeHierarchy() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState<EmployeeRow[]>([])
  const [department, setDepartment] = useState<string>("")
  const [departments, setDepartments] = useState<string[]>([])

  useEffect(() => {
    let mounted = true
    async function loadAll() {
      setLoading(true)
      setError(null)
      const { data, error } = await supabase
        .from("employees")
        .select("id, first_name, last_name, department, position, role")

      if (!mounted) return

      if (error) {
        console.error("Error fetching employees:", error)
        setError(error.message)
        setRows([])
      } else {
        const mapped = (data ?? []) as EmployeeRow[]
        setRows(mapped)
        const depts = Array.from(
          new Set(mapped.map((r) => (r.department ?? "").trim()).filter(Boolean))
        ).sort()
        setDepartments(depts)
        if (depts.length > 0) setDepartment((prev) => (prev || depts[0]))
      }
      setLoading(false)
    }
    loadAll()
    return () => {
      mounted = false
    }
  }, [])

  const deptEmployees = useMemo(
    () => rows.filter((r) => (r.department ?? "") === (department ?? "")),
    [rows, department]
  )

  const roleMatch = (r: string | null, target: string) =>
    !!r && r.toLowerCase().trim() === target.toLowerCase().trim()

  const manager = deptEmployees.find((e) => roleMatch(e.role, "Manager"))
  const assistantManager =
    deptEmployees.find((e) => roleMatch(e.role, "Assistant manager")) ??
    deptEmployees.find((e) => roleMatch(e.role, "Assistant Manager")) ??
    deptEmployees.find((e) => roleMatch(e.role, "Assistant"))
  const supervisor =
    deptEmployees.find((e) => roleMatch(e.role, "Supervisor")) ??
    deptEmployees.find((e) => roleMatch(e.role, "supervisor"))

  // Staff = anything not manager/assistant/supervisor and non-empty role (or role === 'Staff')
  const staff = deptEmployees.filter((e) => {
    const r = (e.role ?? "").toLowerCase().trim()
    return (
      r !== "manager" &&
      r !== "assistant manager" &&
      r !== "assistant" &&
      r !== "supervisor" &&
      r !== ""
    )
  })

  // Box rendering (darker text)
  const Box = ({ e }: { e?: EmployeeRow | null }) => {
    if (!e) {
      return (
        <div className="min-w-[220px] max-w-[260px] text-center py-4 px-6 border border-gray-200 rounded-md bg-white">
          <div className="text-sm text-gray-500">Not assigned</div>
        </div>
      )
    }
    const name = `${e.first_name ?? ""} ${e.last_name ?? ""}`.trim() || "Unnamed"
    const role = e.role ?? "Unknown"
    const position = e.position ?? "—"
    return (
      <div className="min-w-[220px] max-w-[260px] text-center py-4 px-6 border-2 border-green-300 rounded-md bg-white shadow-sm">
        <div className="font-semibold text-gray-900 text-sm">{name}</div>
        <div className="text-gray-800 text-sm mt-1">{role}</div>
        <div className="text-gray-700 text-xs mt-1">{position}</div>
      </div>
    )
  }

  if (loading) {
    return <div className="bg-white rounded-lg border border-gray-200 p-6">Loading…</div>
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 text-red-600">
        Error: {error}
      </div>
    )
  }

  /**
   * SVG helpers for connectors
   * - Vertical connectors between the stacked nodes use simple line segments.
   * - The branch to staff draws a vertical line and then a horizontal bar with evenly spaced ticks.
   */
  const VerticalGap = ({ height = 32 }: { height?: number }) => (
    <div className="flex items-center" aria-hidden>
      <svg width="2" height={height} viewBox={`0 0 2 ${height}`} preserveAspectRatio="none">
        <line x1="1" y1="0" x2="1" y2={height} stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  )

  const BranchToStaff = ({ count = 1 }: { count: number }) => {
    // make a responsive viewBox width depending on count
    const minWidth = 360
    const per = 160 // spacing per staff
    const width = Math.max(minWidth, Math.max(1, count) * per)
    const height = 48
    // center line Y positions
    const verticalToHorizontal = 8
    const hY = verticalToHorizontal + 6
    // compute x positions for ticks evenly spaced across the middle horizontal line
    const padding = 24
    const usable = width - padding * 2
    const xs = Array.from({ length: count }).map((_, i) =>
      Math.round(padding + (i + 0.5) * (usable / count))
    )

    return (
      <div className="w-full flex justify-center pointer-events-none" aria-hidden>
        <svg
          width="100%"
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* vertical line from supervisor downward */}
          <line
            x1={width / 2}
            y1="0"
            x2={width / 2}
            y2={verticalToHorizontal}
            stroke="#cbd5e1"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* horizontal main bar */}
          <line
            x1={padding}
            y1={hY}
            x2={width - padding}
            y2={hY}
            stroke="#e2e8f0"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* vertical ticks up to staff (short) */}
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

          {/* center small connector from vertical down to horizontal (short) */}
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
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Top controls */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-4">
        <CustomSelect value={department} onChange={(e) => setDepartment(e.target.value)}>
          {departments.length === 0 && <option value="">No departments</option>}
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </CustomSelect>

        {/* Plain text label (no button) */}
        <span className="ml-2 text-sm font-medium text-gray-700">Department</span>

        <div className="ml-auto text-sm text-gray-500">{department || "No department selected"}</div>
      </div>

      {/* Hierarchy */}
      <div className="p-8">
        {department ? (
          <div className="flex flex-col items-center w-full space-y-6">
            {/* Manager */}
            <div className="flex flex-col items-center">
              <Box e={manager} />
            </div>

            <VerticalGap height={28} />

            {/* Assistant Manager */}
            <div className="flex flex-col items-center">
              <Box e={assistantManager} />
            </div>

            <VerticalGap height={28} />

            {/* Supervisor */}
            <div className="flex flex-col items-center">
              <Box e={supervisor} />
            </div>

            {/* Branch to staff */}
            <BranchToStaff count={Math.max(1, staff.length || 1)} />

            {/* Staff row: center aligned; grid is responsive */}
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
  )
}

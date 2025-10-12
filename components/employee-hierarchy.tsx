"use client"

import { useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"

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
 * EmployeeHierarchy component
 *
 * Shows a department selector. For the selected department it displays:
 * Manager -> Assistant Manager -> Supervisor -> all Staff
 *
 * Boxes display: Name, Role, Position
 */
export default function EmployeeHierarchy() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState<EmployeeRow[]>([])
  const [department, setDepartment] = useState<string>("")
  const [departments, setDepartments] = useState<string[]>([])

  // Load all employees once (so we can build department list)
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
        // auto-select first department if exists
        if (depts.length > 0) setDepartment((prev) => (prev || depts[0]))
      }
      setLoading(false)
    }
    loadAll()
    return () => {
      mounted = false
    }
  }, [])

  // Filter employees for currently selected department
  const deptEmployees = useMemo(
    () => rows.filter((r) => (r.department ?? "") === (department ?? "")),
    [rows, department]
  )

  // Roles normalization helper (some DB values might vary in capitalization)
  const roleMatch = (r: string | null, target: string) =>
    !!r && r.toLowerCase().trim() === target.toLowerCase().trim()

  // Find single Manager, Assistant Manager and Supervisor. If multiples exist, pick first.
  const manager = deptEmployees.find((e) => roleMatch(e.role, "Manager"))
  const assistantManager =
    deptEmployees.find((e) => roleMatch(e.role, "Assistant manager")) ??
    deptEmployees.find((e) => roleMatch(e.role, "Assistant Manager")) ??
    deptEmployees.find((e) => roleMatch(e.role, "Assistant")) // fallback
  const supervisor =
    deptEmployees.find((e) => roleMatch(e.role, "Supervisor")) ??
    deptEmployees.find((e) => roleMatch(e.role, "supervisor"))

  // All staff (role === Staff or anything not in the top 3)
  const staff = deptEmployees.filter((e) => {
    const r = (e.role ?? "").toLowerCase().trim()
    return (
      r !== "manager" &&
      r !== "assistant manager" &&
      r !== "assistant" &&
      r !== "supervisor" &&
      r !== "supervisor" &&
      r !== ""
    )
  })

  // Render helpers
  const box = (e: EmployeeRow | undefined | null) => {
    if (!e) {
      return (
        <div className="min-w-[220px] max-w-[260px] text-center py-3 px-4 border border-gray-200 rounded-md bg-white shadow-sm">
          <div className="text-sm text-gray-400">Not assigned</div>
        </div>
      )
    }
    const name = `${e.first_name ?? ""} ${e.last_name ?? ""}`.trim() || "Unnamed"
    const role = e.role ?? "Unknown"
    const position = e.position ?? "—"
    return (
      <div className="min-w-[220px] max-w-[260px] text-center py-3 px-4 border-2 border-green-300 rounded-md bg-white shadow-sm">
        <div className="text-sm font-medium text-gray-700">{name}</div>
        <div className="text-xs text-gray-400 mt-1">{role}</div>
        <div className="text-xs text-gray-500 mt-1">{position}</div>
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

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Top controls similar to your employee-list layout */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <CustomSelect
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            aria-label="Select department"
          >
            {departments.length === 0 && <option value="">No departments</option>}
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </CustomSelect>

          <Button className="bg-green-600 hover:bg-green-700" size="sm" onClick={() => {}}>
            Department
          </Button>
        </div>

        <div className="ml-auto text-sm text-gray-500">{department || "No department selected"}</div>
      </div>

      {/* Hierarchy container */}
      <div className="p-8">
        {department ? (
          <div className="flex flex-col items-center w-full">
            {/* Manager */}
            <div className="mb-6 flex flex-col items-center">
              {box(manager)}
            </div>

            {/* vertical connecting line */}
            <div className="w-px bg-gray-300 h-6" />

            {/* Assistant Manager */}
            <div className="mt-6 mb-6 flex flex-col items-center">
              {box(assistantManager)}
            </div>

            <div className="w-px bg-gray-300 h-6" />

            {/* Supervisor */}
            <div className="mt-6 mb-6 flex flex-col items-center">
              {box(supervisor)}
            </div>

            <div className="w-px bg-gray-300 h-6" />

            {/* Staff row */}
            <div className="mt-6 w-full">
              <div className="flex justify-center">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {staff.length > 0 ? (
                    staff.map((s) => (
                      <div key={s.id} className="flex justify-center">
                        {box(s)}
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500">No staff for this department</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 text-sm text-gray-500">Please select a department to view the hierarchy.</div>
        )}
      </div>
    </div>
  )
}

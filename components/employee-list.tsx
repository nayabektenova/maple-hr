"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Search, Plus, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { supabase } from "@/lib/supabaseClient"

// ---- Types (align with your Supabase schema) ----
type Employee = {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  department: string | null
  position: string | null
}

type UIEmployee = {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  department: string
  position: string
}

const CustomSelect = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <div className="relative inline-block">
    <select {...props} className="px-3 py-2 pr-8 border border-gray-300 rounded-md text-sm appearance-none" />
    <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 text-xs">▼</span>
  </div>
)

export function EmployeeList() {
  // UI state
  const [searchTerm, setSearchTerm] = useState("")
  const [alphaSort, setAlphaSort] = useState(false)
  const [downloadType, setDownloadType] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState("")
  const [positionFilter, setPositionFilter] = useState("")
  const [editMode, setEditMode] = useState(false)

  // Data state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState<UIEmployee[]>([])

  // Load employees from Supabase
  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setError(null)
      const { data, error } = await supabase
        .from("employees")
        .select("id, first_name, last_name, email, phone, department, position")

      if (!mounted) return

      if (error) {
        console.error("Error fetching employees:", error)
        setError(error.message)
        setRows([])
      } else {
        const mapped: UIEmployee[] = (data ?? []).map((e: Employee) => ({
          id: e.id,
          firstName: e.first_name ?? "",
          lastName: e.last_name ?? "",
          email: e.email ?? "",
          phone: e.phone ?? "",
          department: e.department ?? "",
          position: e.position ?? "",
        }))
        setRows(mapped)
      }
      setLoading(false)
    }
    load()
    return () => { mounted = false }
  }, [])

  // Filters based on live data (not a static array)
  const departments = useMemo(
    () => Array.from(new Set(rows.map((e) => e.department).filter(Boolean))).sort(),
    [rows]
  )
  const positions = useMemo(
    () => Array.from(new Set(rows.map((e) => e.position).filter(Boolean))).sort(),
    [rows]
  )

  const filteredEmployees = useMemo(() => {
    let list = [...rows]

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase()
      list = list.filter((e) =>
        `${e.id} ${e.firstName} ${e.lastName} ${e.email}`.toLowerCase().includes(q)
      )
    }
    if (departmentFilter) list = list.filter((e) => e.department === departmentFilter)
    if (positionFilter) list = list.filter((e) => e.position === positionFilter)
    if (alphaSort) list = list.sort((a, b) => a.firstName.localeCompare(b.firstName))

    return list
  }, [rows, searchTerm, departmentFilter, positionFilter, alphaSort])

  // Inline editing helpers
  function updateRow(id: string, patch: Partial<UIEmployee>) {
    setRows(prev => prev.map(r => (r.id === id ? { ...r, ...patch } : r)))
  }

  async function handlePrimary() {
    // Toggle between Edit and Save
    if (!editMode) {
      setEditMode(true)
      return
    }

    // Save: upsert edited employees back to Supabase
    // We upsert the *visible* filtered list. If you prefer saving all rows, use `rows` instead of `filteredEmployees`.
    const payload = filteredEmployees.map((e) => ({
      id: e.id,
      first_name: e.firstName,
      last_name: e.lastName,
      email: e.email || null,
      phone: e.phone || null,
      department: e.department || null,
      position: e.position || null,
    }))

    const { error } = await supabase
      .from("employees")
      .upsert(payload, { onConflict: "id" })

    if (error) {
      console.error("Upsert employees error:", error)
      alert("Error saving employees. See console for details.")
      return
    }

    setEditMode(false)
    // Optional: re-fetch to ensure canonical state
    setLoading(true)
    const { data: refreshed, error: refErr } = await supabase
      .from("employees")
      .select("id, first_name, last_name, email, phone, department, position")

    if (refErr) {
      console.error("Refresh employees error:", refErr)
      setLoading(false)
      return
    }
    const mapped: UIEmployee[] = (refreshed ?? []).map((e: Employee) => ({
      id: e.id,
      firstName: e.first_name ?? "",
      lastName: e.last_name ?? "",
      email: e.email ?? "",
      phone: e.phone ?? "",
      department: e.department ?? "",
      position: e.position ?? "",
    }))
    setRows(mapped)
    setLoading(false)
  }

  // Export (CSV for now)
  const handleDownload = () => {
    if (!downloadType) return
    if (downloadType === "CSV") {
      const header = "id,firstName,lastName,email,phone,department,position\n"
      const body = filteredEmployees
        .map((e) =>
          [e.id, e.firstName, e.lastName, e.email, e.phone, e.department, e.position]
            .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
            .join(",")
        )
        .join("\n")
      const blob = new Blob([header + body], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "employees.csv"
      a.click()
      URL.revokeObjectURL(url)
    } else {
      console.log(downloadType + " download coming soon")
    }
  }

  if (loading) {
    return <div className="bg-white rounded-lg border border-gray-200 p-6">Loading employees…</div>
  }

  if (error) {
    return <div className="bg-white rounded-lg border border-gray-200 p-6 text-red-600">Error: {error}</div>
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Top controls (mirrors ScheduleList layout) */}
      <div className="px-6 py-4 border-b border-gray-200 flex flex-col gap-2">
        <div className="flex items-center gap-4">
          <CustomSelect value={downloadType} onChange={(e) => setDownloadType(e.target.value)}>
            <option value="">Select type of data</option>
            <option value="CSV">CSV</option>
            <option value="Excel">Excel (.xlsx)</option>
            <option value="PDF">PDF</option>
          </CustomSelect>
          <Button className="bg-green-600 hover:bg-green-700" size="sm" onClick={handleDownload}>
            Apply
          </Button>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by ID, Name, Email"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <CustomSelect value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
            <option value="">Department</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </CustomSelect>

          <CustomSelect value={positionFilter} onChange={(e) => setPositionFilter(e.target.value)}>
            <option value="">Position</option>
            {positions.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </CustomSelect>

          <div className="flex items-center gap-2">
            <Checkbox id="alphabetic" checked={alphaSort} onCheckedChange={() => setAlphaSort(!alphaSort)} />
            <label htmlFor="alphabetic" className="text-sm text-gray-600">Alphabetic order</label>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button className="bg-green-600 hover:bg-green-700" onClick={handlePrimary}>
              {editMode ? "Save" : "Edit"}
            </Button>

            <Link href="/employees/add">
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                Add employee
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table className="min-w-full table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead className="w-13"></TableHead>
              <TableHead className="w-30">First Name</TableHead>
              <TableHead className="w-30">Last Name</TableHead>
              <TableHead className="w-15">ID</TableHead>
              <TableHead className="w-55">Email</TableHead>
              <TableHead>Phone number</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Position</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEmployees.map((emp) => (
              <TableRow key={emp.id} className="hover:bg-gray-50">
                <TableCell>
                  {/* Example: show details link for a specific id, adjust as needed */}
                  <Link href={`/employees/${emp.id}`}>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </Link>
                </TableCell>

                <TableCell className="font-medium">
                  {editMode ? (
                    <Input
                      value={emp.firstName}
                      onChange={(e) => updateRow(emp.id, { firstName: e.target.value })}
                      className="h-8 text-sm"
                    />
                  ) : emp.firstName}
                </TableCell>

                <TableCell>
                  {editMode ? (
                    <Input
                      value={emp.lastName}
                      onChange={(e) => updateRow(emp.id, { lastName: e.target.value })}
                      className="h-8 text-sm"
                    />
                  ) : emp.lastName}
                </TableCell>

                <TableCell className="text-gray-600">{emp.id}</TableCell>

                <TableCell className="text-gray-600">
                  {editMode ? (
                    <Input
                      value={emp.email}
                      onChange={(e) => updateRow(emp.id, { email: e.target.value })}
                      className="h-8 text-sm"
                      placeholder="name@company.com"
                    />
                  ) : emp.email}
                </TableCell>

                <TableCell className="text-gray-600">
                  {editMode ? (
                    <Input
                      value={emp.phone}
                      onChange={(e) => updateRow(emp.id, { phone: e.target.value })}
                      className="h-8 text-sm"
                      placeholder="+1 000 000 0000"
                    />
                  ) : emp.phone}
                </TableCell>

                <TableCell className="text-gray-600">
                  {editMode ? (
                    <Input
                      value={emp.department}
                      onChange={(e) => updateRow(emp.id, { department: e.target.value })}
                      className="h-8 text-sm"
                      placeholder="Department"
                    />
                  ) : emp.department}
                </TableCell>

                <TableCell className="text-gray-600">
                  {editMode ? (
                    <Input
                      value={emp.position}
                      onChange={(e) => updateRow(emp.id, { position: e.target.value })}
                      className="h-8 text-sm"
                      placeholder="Position"
                    />
                  ) : emp.position}
                </TableCell>

                <TableCell className="w-12"></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

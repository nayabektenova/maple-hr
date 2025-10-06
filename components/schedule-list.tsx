"use client"

import { useMemo, useState, useEffect } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, MoreHorizontal, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { supabase } from "@/lib/supabaseClient"

// ---- Types ----
type WorkLocation = "On-site" | "Remote"
type DayStatus =
  | { kind: "shift"; start: string; end: string; location: WorkLocation }
  | { kind: "off" }
  | { kind: "vacation" }

type Employee = { id: string; firstName: string; lastName: string; department: string }
type Weekday = "Mon" | "Tue" | "Wed" | "Thu" | "Fri"
type WeekSchedule = Record<string, Record<Weekday, DayStatus>>

// fallback / empty while loading
const emptySchedule: WeekSchedule = {}

// these helpers are identical to your original ones
const locations: WorkLocation[] = ["On-site", "Remote"]
const weekdays: Weekday[] = ["Mon","Tue","Wed","Thu","Fri"]

const CustomSelect = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <div className="relative inline-block">
    <select {...props} className="px-3 py-2 pr-8 border border-gray-300 rounded-md text-sm appearance-none" />
    <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 text-xs">▼</span>
  </div>
)

function formatWeekLabel(start: Date): string {
  const end = new Date(start); end.setDate(start.getDate() + 4)
  const sm = start.toLocaleDateString("en-US", { month: "long" })
  const em = end.toLocaleDateString("en-US", { month: "long" })
  return sm === em ? `${sm} ${start.getDate()} – ${end.getDate()}` : `${sm} ${start.getDate()} – ${em} ${end.getDate()}`
}
function getWeekStart(d: Date): Date {
  const date = new Date(d); const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(date.setDate(diff))
}

function ReadonlyShift({ day }: { day: DayStatus }) {
  if (day.kind === "shift") {
    return (
      <div className="py-4">
        <div className="font-medium">{day.start} – {day.end}</div>
        <div className="text-xs text-gray-600">{day.location}</div>
      </div>
    )
  }
  if (day.kind === "off") return <div className="py-4"><div className="font-medium text-red-600">Off</div></div>
  if (day.kind === "vacation") return <div className="py-4"><div className="font-medium text-blue-700">Vacation</div></div>
  return null
}

function EditableShift({
  value,
  onChange,
}: {
  value: DayStatus
  onChange: (next: DayStatus) => void
}) {
  const kind = value.kind

  return (
    <div className="py-3">
      <div className="mb-2">
        <select
          value={kind}
          onChange={(e) => {
            const k = e.target.value as DayStatus["kind"]
            if (k === "shift") {
              onChange({
                kind: "shift",
                start: "8:00 AM",
                end: "5:00 PM",
                location: "On-site",
              })
            } else if (k === "off") {
              onChange({ kind: "off" })
            } else {
              onChange({ kind: "vacation" })
            }
          }}
          className="px-2 py-1 border border-gray-300 rounded-md text-sm w-full"
        >
          <option value="shift">Shift</option>
          <option value="off">Off</option>
          <option value="vacation">Vacation</option>
        </select>
      </div>

      {kind === "shift" && "start" in value && "end" in value && (
        <div className="grid grid-cols-3 gap-2">
          <Input
            value={value.start}
            onChange={(e) => onChange({ ...value, start: e.target.value })}
            className="h-8 text-sm"
            placeholder="Start"
          />
          <Input
            value={value.end}
            onChange={(e) => onChange({ ...value, end: e.target.value })}
            className="h-8 text-sm"
            placeholder="End"
          />
          <select
            value={value.location}
            onChange={(e) => onChange({ ...value, location: e.target.value as WorkLocation })}
            className="px-2 py-1 border border-gray-300 rounded-md text-sm"
          >
            {locations.map((loc) => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>
      )}

      {kind === "off" && <div className="text-sm text-red-600 font-medium">Off</div>}
      {kind === "vacation" && <div className="text-sm text-blue-700 font-medium">Vacation</div>}
    </div>
  )
}

export function ScheduleList() {
  // UI state (same as before)
  const [searchTerm, setSearchTerm] = useState("")
  const [alphaSort, setAlphaSort] = useState(false)
  const [departmentFilter, setDepartmentFilter] = useState("")
  const [locationFilter, setLocationFilter] = useState<"" | WorkLocation>("")

  const [weekStart, setWeekStart] = useState<Date>(() => getWeekStart(new Date()))
  const [published, setPublished] = useState<boolean>(true)

  // edit + schedule state now come from Supabase
  const [editMode, setEditMode] = useState<boolean>(false)
  const [scheduleState, setScheduleState] = useState<WeekSchedule>(emptySchedule)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  // derived lists
  const departments = Array.from(new Set(employees.map(e => e.department)))

  // Fetch employees and schedules from Supabase on mount
  useEffect(() => {
    let mounted = true

    async function loadData() {
      setLoading(true)
      // fetch employees
      const { data: empData, error: empErr } = await supabase
        .from('employees')
        .select('id, first_name, last_name, department')

      if (empErr) {
        console.error('Error fetching employees:', empErr)
      } else if (empData && mounted) {
        const mapped: Employee[] = empData.map((r: any) => ({
          id: r.id,
          firstName: r.first_name,
          lastName: r.last_name,
          department: r.department
        }))
        setEmployees(mapped)
      }

      // fetch schedules
      const { data: schedData, error: schedErr } = await supabase
        .from('schedules')
        .select('employee_id, weekday, kind, start_time, end_time, location')

      if (schedErr) {
        console.error('Error fetching schedules:', schedErr)
      } else if (schedData && mounted) {
        const ws: WeekSchedule = {};
        // initialize with off by default for employees we know (will fill in after)
        (empData ?? []).forEach((e: any) => {
          ws[e.id] = {
            Mon: { kind: "off" },
            Tue: { kind: "off" },
            Wed: { kind: "off" },
            Thu: { kind: "off" },
            Fri: { kind: "off" },
          }
        })

        // apply schedule rows
        schedData.forEach((row: any) => {
          const empId = row.employee_id
          const wd = row.weekday as Weekday
          if (!ws[empId]) {
            ws[empId] = { Mon: { kind: "off" }, Tue: { kind: "off" }, Wed: { kind: "off" }, Thu: { kind: "off" }, Fri: { kind: "off" } }
          }

          if (row.kind === 'shift') {
            ws[empId][wd] = {
              kind: 'shift',
              start: row.start_time ?? '8:00 AM',
              end: row.end_time ?? '5:00 PM',
              location: (row.location as WorkLocation) ?? 'On-site'
            }
          } else if (row.kind === 'off') {
            ws[empId][wd] = { kind: 'off' }
          } else if (row.kind === 'vacation') {
            ws[empId][wd] = { kind: 'vacation' }
          }
        })

        setScheduleState(ws)
      }

      setLoading(false)
    }

    loadData()
    return () => { mounted = false }
  }, [])

  const filtered = useMemo(() => {
    let rows = employees.filter((e) =>
      `${e.firstName} ${e.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (departmentFilter) rows = rows.filter((e) => e.department === departmentFilter)
    if (alphaSort) rows = rows.sort((a, b) => a.firstName.localeCompare(b.firstName))

    if (locationFilter) {
      rows = rows.filter((e) =>
        weekdays.some((d) => {
          const day = scheduleState[e.id]?.[d]
          return day && day.kind === "shift" && day.location === locationFilter
        })
      )
    }

    return rows
  }, [searchTerm, departmentFilter, alphaSort, locationFilter, scheduleState, employees])

  const changeWeek = (dir: "prev" | "next") => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + (dir === "next" ? 7 : -7))
    setWeekStart(d)
  }

  const updateCell = (empId: string, day: Weekday, next: DayStatus) => {
    setScheduleState((prev) => ({
      ...prev,
      [empId]: {
        ...(prev[empId] ?? {}),
        [day]: next,
      },
    }))
  }

  // Save: upsert all changed schedule rows into Supabase
  const handlePrimaryAction = async () => {
    if (editMode) {
      // Save -> upsert changed scheduleState to supabase
      try {
        // build rows in the shape supabase expects
        const rowsToUpsert: any[] = []
        for (const empId of Object.keys(scheduleState)) {
          const empDays = scheduleState[empId]
          for (const wd of Object.keys(empDays) as Weekday[]) {
            const day = empDays[wd]
            if (day.kind === 'shift') {
              rowsToUpsert.push({
                employee_id: empId,
                weekday: wd,
                kind: 'shift',
                start_time: day.start,
                end_time: day.end,
                location: day.location
              })
            } else {
              rowsToUpsert.push({
                employee_id: empId,
                weekday: wd,
                kind: day.kind
              })
            }
          }
        }

        // upsert in batches (Supabase has payload limits — usually fine for small tables)
        const { data, error } = await supabase
          .from('schedules')
          .upsert(rowsToUpsert, { onConflict: 'employee_id,weekday' })

        if (error) {
          console.error('Upsert schedules error:', error)
          alert('Error saving schedules. See console for details.')
        } else {
          // optionally refresh from DB to ensure canonical data
          const { data: refreshed } = await supabase
            .from('schedules')
            .select('employee_id, weekday, kind, start_time, end_time, location')

          if (refreshed) {
            // rebuild state from refreshed rows (same logic as load)
            const ws: WeekSchedule = {};
            (employees ?? []).forEach((e) => {
              ws[e.id] = {
                Mon: { kind: "off" },
                Tue: { kind: "off" },
                Wed: { kind: "off" },
                Thu: { kind: "off" },
                Fri: { kind: "off" },
              }
            })
            refreshed.forEach((row: any) => {
              const empId = row.employee_id
              const wd = row.weekday as Weekday
              if (!ws[empId]) ws[empId] = { Mon: { kind: "off" }, Tue: { kind: "off" }, Wed: { kind: "off" }, Thu: { kind: "off" }, Fri: { kind: "off" } }

              if (row.kind === 'shift') {
                ws[empId][wd] = {
                  kind: 'shift',
                  start: row.start_time ?? '8:00 AM',
                  end: row.end_time ?? '5:00 PM',
                  location: (row.location as WorkLocation) ?? 'On-site'
                }
              } else if (row.kind === 'off') {
                ws[empId][wd] = { kind: 'off' }
              } else if (row.kind === 'vacation') {
                ws[empId][wd] = { kind: 'vacation' }
              }
            })
            setScheduleState(ws)
          }
          setEditMode(false)
        }
      } catch (err) {
        console.error('save error', err)
        alert('Unexpected error saving schedules')
      }
    } else {
      setEditMode(true)
    }
  }

  // Show loader or empty state if data still loading
  if (loading) {
    return <div className="bg-white rounded-lg border border-gray-200 p-6">Loading schedule...</div>
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* --------- HEADER (identical layout to employee list) --------- */}
      <div className="px-6 py-4 border-b border-gray-200 flex flex-col gap-2">
        {/* Row 1 */}
        <div className="flex items-center gap-4">
          <CustomSelect value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </CustomSelect>

          <Button
            className="bg-green-600 hover:bg-green-700"
            size="sm"
            onClick={() => setPublished(!published)}
          >
            {published ? "Unpublish" : "Publish"}
          </Button>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Row 2 */}
        <div className="flex items-center gap-4">
          <CustomSelect value={locationFilter} onChange={(e) => setLocationFilter(e.target.value as any)}>
            <option value="">Location</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </CustomSelect>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => changeWeek("prev")}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium">{formatWeekLabel(weekStart)}</span>
            <Button variant="ghost" size="sm" onClick={() => changeWeek("next")}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox id="alphabetic" checked={alphaSort} onCheckedChange={() => setAlphaSort(!alphaSort)} />
            <label htmlFor="alphabetic" className="text-sm text-gray-600">Alphabetic order</label>
          </div>

          {/* Right-aligned primary action: Edit shift -> Save */}
          <div className="ml-auto">
            <Button className="bg-green-600 hover:bg-green-700" onClick={handlePrimaryAction}>
              {editMode ? "Save" : "Edit shift"}
            </Button>
          </div>
        </div>
      </div>

      {/* --------- TABLE --------- */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>Mon</TableHead>
              <TableHead>Tue</TableHead>
              <TableHead>Wed</TableHead>
              <TableHead>Thu</TableHead>
              <TableHead>Fri</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filtered.map((emp) => (
              <TableRow key={emp.id} className="hover:bg-gray-50">
                {/* leading actions cell */}
                <TableCell>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </TableCell>

                {/* name cell */}
                <TableCell className="font-medium">
                  <div className="font-medium">{emp.firstName}</div>
                  <div className="text-gray-600">{emp.lastName}</div>
                </TableCell>

                {/* weekday cells */}
                {weekdays.map((day) => {
                  const value = scheduleState[emp.id]?.[day] || { kind: "off" }
                  return (
                    <TableCell key={day} className="text-gray-800 align-top">
                      {editMode ? (
                        <EditableShift
                          value={value}
                          onChange={(next) => updateCell(emp.id, day, next)}
                        />
                      ) : (
                        <ReadonlyShift day={value} />
                      )}
                    </TableCell>
                  )
                })}

                {/* trailing actions spacer */}
                <TableCell></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, MoreHorizontal, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// ---- Types ----
type WorkLocation = "On-site" | "Remote"
type DayStatus =
  | { kind: "shift"; start: string; end: string; location: WorkLocation }
  | { kind: "off" }
  | { kind: "vacation" }

type Employee = { id: string; firstName: string; lastName: string; department: string }
type Weekday = "Mon" | "Tue" | "Wed" | "Thu" | "Fri"
type WeekSchedule = Record<string, Record<Weekday, DayStatus>>

// ---- Data (example) ----
const employees: Employee[] = [
  { id: "1", firstName: "Saul", lastName: "Mullins", department: "Development" },
  { id: "2", firstName: "Amirah", lastName: "Vincent", department: "Development" },
  { id: "3", firstName: "Morgan", lastName: "Terrell", department: "Development" },
  { id: "4", firstName: "Henrietta", lastName: "Gibbs", department: "Marketing" },
  { id: "5", firstName: "Enzo", lastName: "Cobb", department: "Development" },
  { id: "6", firstName: "Fintan", lastName: "Huff", department: "Development" },
  { id: "7", firstName: "Lena", lastName: "Dixon", department: "Finance" },
  { id: "8", firstName: "Cole", lastName: "Stanton", department: "Development" },
]

const initialSchedule: WeekSchedule = {
  "1": { Mon:{kind:"shift",start:"8:00 AM",end:"5:00 PM",location:"Remote"}, Tue:{kind:"shift",start:"8:00 AM",end:"5:00 PM",location:"Remote"}, Wed:{kind:"off"}, Thu:{kind:"shift",start:"8:00 AM",end:"5:00 PM",location:"On-site"}, Fri:{kind:"shift",start:"8:00 AM",end:"5:00 PM",location:"On-site"} },
  "2": { Mon:{kind:"shift",start:"8:00 AM",end:"5:00 PM",location:"On-site"}, Tue:{kind:"shift",start:"8:00 AM",end:"5:00 PM",location:"Remote"}, Wed:{kind:"shift",start:"8:00 AM",end:"5:00 PM",location:"On-site"}, Thu:{kind:"shift",start:"8:00 AM",end:"5:00 PM",location:"Remote"}, Fri:{kind:"shift",start:"8:00 AM",end:"5:00 PM",location:"On-site"} },
  "3": { Mon:{kind:"shift",start:"8:00 AM",end:"5:00 PM",location:"On-site"}, Tue:{kind:"shift",start:"8:00 AM",end:"5:00 PM",location:"On-site"}, Wed:{kind:"shift",start:"8:00 AM",end:"5:00 PM",location:"On-site"}, Thu:{kind:"shift",start:"8:00 AM",end:"5:00 PM",location:"On-site"}, Fri:{kind:"shift",start:"8:00 AM",end:"5:00 PM",location:"On-site"} },
  "4": { Mon:{kind:"shift",start:"8:00 AM",end:"5:00 PM",location:"On-site"}, Tue:{kind:"shift",start:"8:00 AM",end:"5:00 PM",location:"Remote"}, Wed:{kind:"off"}, Thu:{kind:"shift",start:"8:00 AM",end:"5:00 PM",location:"Remote"}, Fri:{kind:"shift",start:"8:00 AM",end:"5:00 PM",location:"On-site"} },
  "5": { Mon:{kind:"shift",start:"8:00 AM",end:"5:00 PM",location:"On-site"}, Tue:{kind:"shift",start:"8:00 AM",end:"5:00 PM",location:"On-site"}, Wed:{kind:"shift",start:"8:00 AM",end:"5:00 PM",location:"On-site"}, Thu:{kind:"shift",start:"8:00 AM",end:"5:00 PM",location:"On-site"}, Fri:{kind:"shift",start:"8:00 AM",end:"5:00 PM",location:"On-site"} },
  "6": { Mon:{kind:"vacation"}, Tue:{kind:"vacation"}, Wed:{kind:"vacation"}, Thu:{kind:"vacation"}, Fri:{kind:"vacation"} },
  "7": { Mon:{kind:"shift",start:"8:00 AM",end:"5:00 PM",location:"On-site"}, Tue:{kind:"shift",start:"8:00 AM",end:"5:00 PM",location:"Remote"}, Wed:{kind:"shift",start:"8:00 AM",end:"5:00 PM",location:"On-site"}, Thu:{kind:"shift",start:"8:00 AM",end:"5:00 PM",location:"On-site"}, Fri:{kind:"shift",start:"8:00 AM",end:"5:00 PM",location:"On-site"} },
  "8": { Mon:{kind:"shift",start:"8:00 AM",end:"5:00 PM",location:"On-site"}, Tue:{kind:"off"}, Wed:{kind:"shift",start:"8:00 AM",end:"5:00 PM",location:"On-site"}, Thu:{kind:"shift",start:"8:00 AM",end:"5:00 PM",location:"On-site"}, Fri:{kind:"shift",start:"8:00 AM",end:"5:00 PM",location:"On-site"} },
}

const departments = Array.from(new Set(employees.map(e => e.department)))
const locations: WorkLocation[] = ["On-site", "Remote"]
const weekdays: Weekday[] = ["Mon","Tue","Wed","Thu","Fri"]

// ---- Helpers (same style as employee list) ----
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

// Edit cell with inline controls
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
      {/* Kind selector */}
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
  // —— SAME header controls / spacing as employee list ——
  const [searchTerm, setSearchTerm] = useState("")
  const [alphaSort, setAlphaSort] = useState(false)
  const [departmentFilter, setDepartmentFilter] = useState(departments[0] ?? "")
  const [locationFilter, setLocationFilter] = useState<"" | WorkLocation>("")

  const [weekStart, setWeekStart] = useState<Date>(() => getWeekStart(new Date()))
  const [published, setPublished] = useState<boolean>(true)

  // NEW: edit mode + schedule state
  const [editMode, setEditMode] = useState<boolean>(false)
  const [scheduleState, setScheduleState] = useState<WeekSchedule>(() => JSON.parse(JSON.stringify(initialSchedule)))

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
  }, [searchTerm, departmentFilter, alphaSort, locationFilter, scheduleState])

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

  const handlePrimaryAction = () => {
    if (editMode) {
      // “Save” — you could persist to API here.
      setEditMode(false)
    } else {
      // “Edit shift”
      setEditMode(true)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* --------- HEADER (identical layout to employee-list) --------- */}
      <div className="px-6 py-4 border-b border-gray-200 flex flex-col gap-2">
        {/* Row 1 */}
        <div className="flex items-center gap-4">
          <CustomSelect value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
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

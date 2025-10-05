"use client"

import { useMemo, useState } from "react"
import { CheckCircle2, XCircle, History, Clock3, Search, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// ----- Types -----
type LeaveType =
  | "Sick Time Off"
  | "Paid Time Off"
  | "Unpaid"
  | "Compensatory Days"
  | "Parental Leave"

type LeaveStatus = "pending" | "approved" | "denied"

type LeaveRequest = {
  id: string
  firstName: string
  lastName: string
  employeeId: string
  type: LeaveType
  startDate: string // MM/DD/YYYY
  endDate: string   // MM/DD/YYYY
  status: LeaveStatus
}

// ----- Mock Data -----
const seedPending: LeaveRequest[] = [
  { id: "L-1001", firstName: "Abel",      lastName: "Fekadu",    employeeId: "12345678", type: "Sick Time Off",       startDate: "06/17/2025", endDate: "06/18/2025", status: "pending" },
  { id: "L-1002", firstName: "Naya",      lastName: "Bektenova", employeeId: "12345678", type: "Paid Time Off",       startDate: "06/02/2025", endDate: "06/22/2025", status: "pending" },
  { id: "L-1003", firstName: "Hunter",    lastName: "Tapping",   employeeId: "12345678", type: "Unpaid",              startDate: "06/13/2025", endDate: "06/16/2025", status: "pending" },
  { id: "L-1004", firstName: "Darshan",   lastName: "Dahal",     employeeId: "12345678", type: "Compensatory Days",   startDate: "07/02/2025", endDate: "07/09/2025", status: "pending" },
  { id: "L-1005", firstName: "Donald",    lastName: "Trump",     employeeId: "12345678", type: "Parental Leave",      startDate: "05/01/2025", endDate: "06/14/2025", status: "pending" },
  { id: "L-1006", firstName: "Vladimir",  lastName: "Putin",     employeeId: "12345678", type: "Sick Time Off",       startDate: "06/17/2025", endDate: "06/18/2025", status: "pending" },
  { id: "L-1007", firstName: "Volodymyr", lastName: "Zelensky",  employeeId: "12345678", type: "Paid Time Off",       startDate: "06/02/2025", endDate: "06/22/2025", status: "pending" },
  { id: "L-1008", firstName: "Zayn",      lastName: "Malik",     employeeId: "12345678", type: "Unpaid",              startDate: "06/13/2025", endDate: "06/16/2025", status: "pending" },
  { id: "L-1009", firstName: "Harry",     lastName: "Styles",    employeeId: "12345678", type: "Compensatory Days",   startDate: "07/02/2025", endDate: "07/09/2025", status: "pending" },
  { id: "L-1010", firstName: "Liam",      lastName: "Payne",     employeeId: "12345678", type: "Parental Leave",      startDate: "05/01/2025", endDate: "06/14/2025", status: "pending" },
  { id: "L-1011", firstName: "Selena",    lastName: "Gomez",     employeeId: "12345678", type: "Sick Time Off",       startDate: "06/17/2025", endDate: "06/18/2025", status: "pending" },
  { id: "L-1012", firstName: "Taylor",    lastName: "Swift",     employeeId: "12345678", type: "Paid Time Off",       startDate: "06/02/2025", endDate: "06/22/2025", status: "pending" },
  { id: "L-1013", firstName: "Saul",      lastName: "Mullins",   employeeId: "12345678", type: "Unpaid",              startDate: "06/13/2025", endDate: "06/16/2025", status: "pending" },
  { id: "L-1014", firstName: "Amirah",    lastName: "Vincent",   employeeId: "12345678", type: "Compensatory Days",   startDate: "07/02/2025", endDate: "07/09/2025", status: "pending" },
]

const seedHistory: LeaveRequest[] = [
  { id: "H-2001", firstName: "Abel",      lastName: "Fekadu",    employeeId: "12345678", type: "Sick Time Off",       startDate: "06/17/2025", endDate: "06/18/2025", status: "approved" },
  { id: "H-2002", firstName: "Naya",      lastName: "Bektenova", employeeId: "12345678", type: "Paid Time Off",       startDate: "06/02/2025", endDate: "06/22/2025", status: "denied"   },
  { id: "H-2003", firstName: "Hunter",    lastName: "Tapping",   employeeId: "12345678", type: "Unpaid",              startDate: "06/13/2025", endDate: "06/16/2025", status: "denied"   },
  { id: "H-2004", firstName: "Darshan",   lastName: "Dahal",     employeeId: "12345678", type: "Compensatory Days",   startDate: "07/02/2025", endDate: "07/09/2025", status: "approved" },
  { id: "H-2005", firstName: "Donald",    lastName: "Trump",     employeeId: "12345678", type: "Parental Leave",      startDate: "05/01/2025", endDate: "06/14/2025", status: "denied"   },
  { id: "H-2006", firstName: "Vladimir",  lastName: "Putin",     employeeId: "12345678", type: "Sick Time Off",       startDate: "06/17/2025", endDate: "06/18/2025", status: "approved" },
  { id: "H-2007", firstName: "Volodymyr", lastName: "Zelensky",  employeeId: "12345678", type: "Paid Time Off",       startDate: "06/02/2025", endDate: "06/22/2025", status: "approved" },
  { id: "H-2008", firstName: "Zayn",      lastName: "Malik",     employeeId: "12345678", type: "Unpaid",              startDate: "06/13/2025", endDate: "06/16/2025", status: "approved" },
  { id: "H-2009", firstName: "Harry",     lastName: "Styles",    employeeId: "12345678", type: "Compensatory Days",   startDate: "07/02/2025", endDate: "07/09/2025", status: "denied"   },
  { id: "H-2010", firstName: "Liam",      lastName: "Payne",     employeeId: "12345678", type: "Parental Leave",      startDate: "05/01/2025", endDate: "06/14/2025", status: "denied"   },
  { id: "H-2011", firstName: "Selena",    lastName: "Gomez",     employeeId: "12345678", type: "Sick Time Off",       startDate: "06/17/2025", endDate: "06/18/2025", status: "approved" },
  { id: "H-2012", firstName: "Taylor",    lastName: "Swift",     employeeId: "12345678", type: "Paid Time Off",       startDate: "06/02/2025", endDate: "06/22/2025", status: "denied"   },
  { id: "H-2013", firstName: "Saul",      lastName: "Mullins",   employeeId: "12345678", type: "Unpaid",              startDate: "06/13/2025", endDate: "06/16/2025", status: "approved" },
  { id: "H-2014", firstName: "Amirah",    lastName: "Vincent",   employeeId: "12345678", type: "Compensatory Days",   startDate: "07/02/2025", endDate: "07/09/2025", status: "approved" },
]

// ----- Small pill button -----
function Pill({
  active,
  icon: Icon,
  children,
  onClick,
}: {
  active?: boolean
  icon: any
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={
        "inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm " +
        (active
          ? "border-green-600 text-green-700"
          : "border-gray-300 text-gray-700 hover:bg-gray-50")
      }
    >
      <Icon className="h-4 w-4" />
      {children}
    </button>
  )
}

// ----- Component -----
export function LeavesList() {
  const [tab, setTab] = useState<"pending" | "history">("pending")
  const [pending, setPending] = useState<LeaveRequest[]>(seedPending)
  const [history, setHistory] = useState<LeaveRequest[]>(seedHistory)

  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<LeaveType | "">("")
  const [historyStatus, setHistoryStatus] = useState<"" | "approved" | "denied">("")

  // Visible rows (includes all filters)
  const visibleRows = useMemo(() => {
    const base = tab === "pending" ? pending : history
    return base.filter((r) => {
      const matchesQuery =
        `${r.firstName} ${r.lastName} ${r.employeeId}`.toLowerCase().includes(search.toLowerCase())
      const matchesType = typeFilter ? r.type === typeFilter : true
      const matchesHist = tab === "history" ? (historyStatus ? r.status === historyStatus : true) : true
      return matchesQuery && matchesType && matchesHist
    })
  }, [tab, pending, history, search, typeFilter, historyStatus])

  // Approve / Deny — duplicate-proof & StrictMode-safe
  const act = (id: string, decision: "approved" | "denied") => {
    const req = pending.find((r) => r.id === id)
    if (!req) return

    setPending((prev) => prev.filter((r) => r.id !== id))
    setHistory((prev) => {
      if (prev.some((x) => x.id === id)) return prev
      return [{ ...req, status: decision }, ...prev]
    })
    setTab("history")
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex flex-col gap-2">
        {/* Row 1: tabs */}
        <div className="flex items-center gap-3">
          <Pill active={tab === "pending"} icon={Clock3} onClick={() => setTab("pending")}>
            Pending leave requests
          </Pill>
          <Pill active={tab === "history"} icon={History} onClick={() => setTab("history")}>
            History
          </Pill>
        </div>

        {/* Row 2: search + Filters dropdown */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by ID, Name, Email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
                <Filter className="h-4 w-4" />
                Filters
                {typeFilter ? `: ${typeFilter}` : ""}
                {tab === "history" && historyStatus ? ` • ${historyStatus[0].toUpperCase()}${historyStatus.slice(1)}` : ""}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              <DropdownMenuLabel>Type of request</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setTypeFilter("")}>All types</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTypeFilter("Sick Time Off")}>Sick Time Off</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTypeFilter("Paid Time Off")}>Paid Time Off</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTypeFilter("Unpaid")}>Unpaid</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTypeFilter("Compensatory Days")}>Compensatory Days</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTypeFilter("Parental Leave")}>Parental Leave</DropdownMenuItem>

              {tab === "history" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Status</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setHistoryStatus("")}>All</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setHistoryStatus("approved")}>Approved</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setHistoryStatus("denied")}>Denied</DropdownMenuItem>
                </>
              )}

              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setTypeFilter("")
                  setHistoryStatus("")
                }}
              >
                Clear filters
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>First Name</TableHead>
            <TableHead>Last Name</TableHead>
            <TableHead>ID</TableHead>
            <TableHead>Type of request</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead>Decision</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {visibleRows.map((r) => (
            <TableRow key={r.id} className="hover:bg-gray-50">
              <TableCell className="font-medium">{r.firstName}</TableCell>
              <TableCell>{r.lastName}</TableCell>
              <TableCell className="text-gray-600">{r.employeeId}</TableCell>
              <TableCell className="text-gray-600">{r.type}</TableCell>
              <TableCell className="text-gray-600">{r.startDate}</TableCell>
              <TableCell className="text-gray-600">{r.endDate}</TableCell>

              <TableCell>
                {tab === "pending" ? (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => act(r.id, "approved")}
                      className="inline-flex items-center gap-1 text-green-700 hover:underline"
                    >
                      <CheckCircle2 className="h-4 w-4" /> Approve
                    </button>
                    <button
                      onClick={() => act(r.id, "denied")}
                      className="inline-flex items-center gap-1 text-red-700 hover:underline"
                    >
                      <XCircle className="h-4 w-4" /> Deny
                    </button>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1">
                    {r.status === "approved" ? (
                      <span className="inline-flex items-center gap-1 text-green-700">
                        <CheckCircle2 className="h-4 w-4" /> Approved
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-700">
                        <XCircle className="h-4 w-4" /> Denied
                      </span>
                    )}
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

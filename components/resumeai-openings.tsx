"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Search, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type Opening = {
  id: string
  openings: number
  applicants: number
  title: string
  department: string
  jobType: "Full-Time" | "Co-Op" | "Part-Time" | "Contract"
}

const seed: Opening[] = [
  { id: "co-op-se", openings: 13, applicants: 126, title: "Software Engineer Co-Op",      department: "Development",   jobType: "Co-Op" },
  { id: "se-i",     openings:  9, applicants:  87, title: "Software Engineer I",          department: "Development",   jobType: "Full-Time" },
  { id: "se-ii",    openings: 12, applicants: 151, title: "Software Engineer II",         department: "Development",   jobType: "Full-Time" },
  { id: "se-iii",   openings:  4, applicants: 117, title: "Software Engineer III",        department: "Development",   jobType: "Full-Time" },
  { id: "jan-asst", openings:  6, applicants:  34, title: "Janitor assistant",            department: "Maintenance",   jobType: "Full-Time" },
  { id: "janitor",  openings:  4, applicants:  45, title: "Janitor",                      department: "Maintenance",   jobType: "Full-Time" },
  { id: "csmgr",    openings:  1, applicants: 174, title: "Cybersecurity Manager",        department: "Cybersecurity", jobType: "Full-Time" },
  { id: "dms",      openings:  4, applicants: 146, title: "Digital Marketing Specialist", department: "Marketing",     jobType: "Full-Time" },
  { id: "comms",    openings:  2, applicants: 182, title: "Communications Specialist",    department: "Marketing",     jobType: "Full-Time" },
]

const DEPTS = ["Development", "Marketing", "Finance", "Administration", "Maintenance", "Cybersecurity"]
const TYPES: Opening["jobType"][] = ["Full-Time", "Co-Op", "Part-Time", "Contract"]

export function ResumeAIJobOpenings() {
  const [rows, setRows] = useState<Opening[]>(seed)
  const [search, setSearch] = useState("")
  const [dept, setDept] = useState<string>("")
  const [type, setType] = useState<Opening["jobType"] | "">("")

  const visible = useMemo(() => {
    return rows.filter((r) => {
      const q = `${r.title} ${r.department}`.toLowerCase()
      const matchesQ = q.includes(search.toLowerCase())
      const matchesD = dept ? r.department === dept : true
      const matchesT = type ? r.jobType === type : true
      return matchesQ && matchesD && matchesT
    })
  }, [rows, search, dept, type])

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header toolbar */}
      <div className="px-6 py-4 border-b border-gray-200 flex flex-col gap-2">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search"
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
                {dept ? `: ${dept}` : ""}
                {type ? ` • ${type}` : ""}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              <DropdownMenuLabel>Department</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setDept("")}>All</DropdownMenuItem>
              {DEPTS.map((d) => (
                <DropdownMenuItem key={d} onClick={() => setDept(d)}>{d}</DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Job Type</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setType("")}>All</DropdownMenuItem>
              {TYPES.map((t) => (
                <DropdownMenuItem key={t} onClick={() => setType(t)}>{t}</DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => { setDept(""); setType(""); }}>
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
            <TableHead className="w-28"># Openings</TableHead>
            <TableHead className="w-28"># Applicants</TableHead>
            <TableHead>Job Title</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Job Type</TableHead>
            <TableHead className="w-64 text-right"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visible.map((r) => (
            <TableRow key={r.id} className="hover:bg-gray-50">
              <TableCell className="font-medium">{r.openings}</TableCell>
              <TableCell>{r.applicants}</TableCell>
              <TableCell className="text-gray-700">{r.title}</TableCell>
              <TableCell className="text-gray-600">{r.department}</TableCell>
              <TableCell className="text-gray-600">{r.jobType}</TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-3">
                  <Link href={`/resume-ai/${r.id}`}>
                    <Button variant="outline" className="border-green-600 text-green-700 hover:bg-green-50">
                      View Applicants
                    </Button>
                  </Link>
                  <button
                    className="text-gray-500 hover:underline"
                    onClick={() => setRows((prev) => prev.filter((x) => x.id !== r.id))}
                  >
                    Remove
                  </button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

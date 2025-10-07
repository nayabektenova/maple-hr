"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Search, Filter, ArrowLeft } from "lucide-react"
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
import { cn } from "@/lib/utils"

type Applicant = {
  id: string
  name: string
  jobTitle: string
  compatibility: number // 0-100
  resumeStatus: "View" | "Viewed"
  decision?: "Approved" | "Declined"
}

const seedApplicants: Applicant[] = [
  { id: "a1", name: "Hana Takahashi",  jobTitle: "Software Engineer I", compatibility: 75, resumeStatus: "Viewed" },
  { id: "a2", name: "Amara Johnson",   jobTitle: "Software Engineer I", compatibility: 65, resumeStatus: "View" },
  { id: "a3", name: "Sofia Haddad",    jobTitle: "Software Engineer I", compatibility: 99, resumeStatus: "Viewed", decision: "Approved" },
  { id: "a4", name: "Marcus O'Connor", jobTitle: "Software Engineer I", compatibility:  4, resumeStatus: "Viewed", decision: "Declined" },
  { id: "a5", name: "Ethan Patel",     jobTitle: "Software Engineer I", compatibility: 75, resumeStatus: "Viewed" },
  { id: "a6", name: "Naomi Okafor",    jobTitle: "Software Engineer I", compatibility: 65, resumeStatus: "View" },
  { id: "a7", name: "Emily Zhang",     jobTitle: "Software Engineer I", compatibility: 99, resumeStatus: "Viewed", decision: "Approved" },
  { id: "a8", name: "Olivia Kim",      jobTitle: "Software Engineer I", compatibility:  4, resumeStatus: "Viewed", decision: "Declined" },
  { id: "a9", name: "Dmitry Volkov",   jobTitle: "Software Engineer I", compatibility: 75, resumeStatus: "Viewed" },
]

const DECISIONS: Array<Applicant["decision"] | ""> = ["", "Approved", "Declined"]
const RESUME_SEEN: Applicant["resumeStatus"][] = ["View", "Viewed"]

export function ResumeAIApplicants() {
  const params = useParams<{ jobId: string }>()
  const jobId = params?.jobId

  const [rows, setRows] = useState<Applicant[]>(seedApplicants)
  const [search, setSearch] = useState("")
  const [decisionFilter, setDecisionFilter] = useState<Applicant["decision"] | "">("")
  const [resumeFilter, setResumeFilter] = useState<Applicant["resumeStatus"] | "">("")

  const visible = useMemo(() => {
    return rows.filter((r) => {
      const matchesQ = r.name.toLowerCase().includes(search.toLowerCase())
      const matchesD = decisionFilter ? r.decision === decisionFilter : true
      const matchesR = resumeFilter ? r.resumeStatus === resumeFilter : true
      return matchesQ && matchesD && matchesR
    })
  }, [rows, search, decisionFilter, resumeFilter])

  const setDecision = (id: string, d: Exclude<Applicant["decision"], undefined>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, decision: d } : r)))
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header toolbar */}
      <div className="px-6 py-4 border-b border-gray-200 flex flex-col gap-2">
        <div className="flex items-center gap-4">
          <Link href="/resume-ai" className="inline-flex items-center gap-2 text-gray-700 hover:underline mr-2">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>

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
                {resumeFilter ? `: ${resumeFilter}` : ""}
                {decisionFilter ? ` • ${decisionFilter}` : ""}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>Resume</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setResumeFilter("")}>All</DropdownMenuItem>
              {RESUME_SEEN.map((s) => (
                <DropdownMenuItem key={s} onClick={() => setResumeFilter(s)}>{s}</DropdownMenuItem>
              ))}

              <DropdownMenuSeparator />
              <DropdownMenuLabel>Decisions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setDecisionFilter("")}>All</DropdownMenuItem>
              {DECISIONS.filter(Boolean).map((d) => (
                <DropdownMenuItem key={d as string} onClick={() => setDecisionFilter(d as any)}>
                  {d}
                </DropdownMenuItem>
              ))}

              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => { setResumeFilter(""); setDecisionFilter(""); }}>
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
            <TableHead className="w-32">Compatibility</TableHead>
            <TableHead>Full Name</TableHead>
            <TableHead>Job Title</TableHead>
            <TableHead>Resume</TableHead>
            <TableHead className="w-60 text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visible.map((r) => (
            <TableRow key={r.id} className="hover:bg-gray-50">
              <TableCell className="font-medium">{r.compatibility}%</TableCell>
              <TableCell className="text-gray-700">{r.name}</TableCell>
              <TableCell className="text-gray-600">{r.jobTitle}</TableCell>
              <TableCell>
                {r.resumeStatus === "View" ? (
                    <Link href={`/resume-ai/${jobId}/applicant/${r.id}`} className="text-green-700 hover:underline">
                    View
                    </Link>
                ) : (
                    <Link href={`/resume-ai/${jobId}/applicant/${r.id}`} className="text-gray-700 hover:underline">
                    Viewed
                    </Link>
                )}
              </TableCell>
              <TableCell className="text-right">
                {r.decision ? (

                  <span
                    className={cn(
                      "px-2 py-1 rounded-md text-sm",
                      r.decision === "Approved"
                        ? "text-green-700 bg-green-50 border border-green-200"
                        : "text-red-700 bg-red-50 border border-red-200"
                    )}
                  >
                    {r.decision}
                  </span>
                ) : (
                  <div className="flex items-center justify-end gap-3">
                    <Button variant="outline" onClick={() => setDecision(r.id, "Approved")} className="border-green-600 text-green-700 hover:bg-green-50">
                      Approve
                    </Button>
                    <button className="text-gray-500 hover:underline" onClick={() => setDecision(r.id, "Declined")}>
                      Decline
                    </button>
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

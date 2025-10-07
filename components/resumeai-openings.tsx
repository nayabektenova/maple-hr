"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/lib/supabaseClient";

type JobType = "Full-Time" | "Co-Op" | "Part-Time" | "Contract";
const VALID_TYPES: JobType[] = ["Full-Time", "Co-Op", "Part-Time", "Contract"];

type DBRow = {
  job_id: number;       // NEW numeric Job ID
  id: string;           // legacy text id (kept in DB)
  title: string;
  department: string;
  job_type: string;
  openings: number;
  applicants: number;
};

type Opening = {
  jobId: number;        // use numeric ID in UI/links
  id: string;           // keep around if you still need it
  openings: number;
  applicants: number;
  title: string;
  department: string;
  jobType: JobType;
};

const toJobType = (s: string | null | undefined): JobType =>
  (VALID_TYPES as string[]).includes((s ?? "")) ? (s as JobType) : "Full-Time";

export function ResumeAIJobOpenings() {
  const [rows, setRows] = useState<Opening[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState<string>("");
  const [type, setType] = useState<JobType | "">("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setErr(null);

      const { data, error } = await supabase
        .from("job_openings")
        .select("job_id, id, title, department, job_type, openings, applicants")
        .order("created_at", { ascending: false });

      if (!mounted) return;

      if (error) {
        setErr(error.message);
        setRows([]);
      } else {
        const mapped: Opening[] = (data ?? []).map((r: DBRow) => ({
          jobId: r.job_id,
          id: r.id,
          openings: r.openings ?? 0,
          applicants: r.applicants ?? 0,
          title: r.title ?? "",
          department: r.department ?? "",
          jobType: toJobType(r.job_type),
        }));
        setRows(mapped);
      }

      setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  // Build department list from live data
  const DEPTS = useMemo(
    () => Array.from(new Set(rows.map(r => r.department).filter(Boolean))).sort(),
    [rows]
  );

  // Apply filters
  const visible = useMemo(() => {
    return rows.filter((r) => {
      const q = `${r.title} ${r.department}`.toLowerCase();
      const matchesQ = q.includes(search.toLowerCase());
      const matchesD = dept ? r.department === dept : true;
      const matchesT = type ? r.jobType === type : true;
      return matchesQ && matchesD && matchesT;
    });
  }, [rows, search, dept, type]);

  // Delete by numeric job_id
  async function handleDelete(jobId: number) {
    if (!confirm("Delete this job opening? This removes it only from 'job_openings'.")) return;
    const prev = rows;
    setRows((p) => p.filter((x) => x.jobId !== jobId)); // optimistic
    const { error } = await supabase.from("job_openings").delete().eq("job_id", jobId);
    if (error) {
      setRows(prev); // rollback
      alert(`Failed to delete job: ${error.message}`);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        Loading job openings…
      </div>
    );
  }

  if (err) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 text-red-600">
        Error: {err}
      </div>
    );
  }

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
                <DropdownMenuItem key={d} onClick={() => setDept(d)}>
                  {d}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Job Type</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setType("")}>All</DropdownMenuItem>
              {VALID_TYPES.map((t) => (
                <DropdownMenuItem key={t} onClick={() => setType(t)}>
                  {t}
                </DropdownMenuItem>
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
            <TableHead className="w-20">Job ID</TableHead> {/* NEW */}
            <TableHead>Job Title</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Job Type</TableHead>
            <TableHead className="w-64 text-right"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visible.map((r) => (
            <TableRow key={r.jobId} className="hover:bg-gray-50">
              <TableCell className="font-medium">{r.openings}</TableCell>
              <TableCell>{r.applicants}</TableCell>
              <TableCell>{r.jobId}</TableCell> {/* NEW */}
              <TableCell className="text-gray-700">{r.title}</TableCell>
              <TableCell className="text-gray-600">{r.department}</TableCell>
              <TableCell className="text-gray-600">{r.jobType}</TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-3">
                  <Link href={`/resume-ai/${r.jobId}`} prefetch={false}>
                    <Button variant="outline" className="border-green-600 text-green-700 hover:bg-green-50">
                      View Applicants
                    </Button>
                  </Link>
                  <button
                    className="text-red-600 hover:underline"
                    onClick={() => handleDelete(r.jobId)}
                  >
                    Delete job
                  </button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {visible.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="py-10 text-center text-gray-500">
                No matching jobs.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

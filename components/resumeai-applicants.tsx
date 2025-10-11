"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type DBApplicant = {
  id: string;
  job_title: string;
  full_name: string;
  compatibility: number;
  status: "View" | "Viewed";
};

type UIApplicant = {
  id: string;
  jobTitle: string;
  name: string;
  compatibility: number;
  status: "View" | "Viewed";
  decision?: "Approved" | "Declined";
};

const STATUS_FILTERS: Array<UIApplicant["status"] | ""> = ["", "View", "Viewed"];
const DECISIONS: Array<UIApplicant["decision"] | ""> = ["", "Approved", "Declined"];

export function ResumeAIApplicants() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Support folder param [jobID] and query (?jobId=123), plus optional ?title=
  const rawFromParam = (params?.jobID ?? (params as any)?.jobId ?? (params as any)?.id) as string | undefined;
  const rawFromQuery = searchParams.get("jobId") ?? undefined;
  const rawJobId = rawFromParam ?? rawFromQuery;
  const jobId = rawJobId && /^\d+$/.test(rawJobId) ? Number(rawJobId) : null;

  const titleFromQuery = searchParams.get("title") ?? "";

  const [jobTitle, setJobTitle] = useState<string>("");
  const [rows, setRows] = useState<UIApplicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<UIApplicant["status"] | "">("");
  const [decisionFilter, setDecisionFilter] = useState<UIApplicant["decision"] | "">("");

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      setErr(null);

      // 1) Resolve job title
      let title = titleFromQuery.trim();

      if (!title) {
        if (!jobId) {
          setErr("Invalid job id in route.");
          setLoading(false);
          return;
        }

        const { data: opening, error: openingErr } = await supabase
          .from("job_openings")
          .select("title")
          .eq("job_id", jobId)
          .maybeSingle();

        if (!mounted) return;

        if (openingErr) {
          setErr(`Failed to fetch opening: ${openingErr.message}`);
          setLoading(false);
          return;
        }
        if (!opening?.title) {
          setErr("No job title found for this opening.");
          setLoading(false);
          return;
        }

        title = opening.title as string;
      }

      setJobTitle(title);

      // 2) Fetch applicants by title
      const { data: applicants, error: appsErr } = await supabase
        .from("resumeai_applicants")
        .select("id, job_title, full_name, compatibility, status")
        .eq("job_title", title)
        .order("compatibility", { ascending: false });

      if (!mounted) return;

      if (appsErr) {
        setErr(`Failed to fetch applicants: ${appsErr.message}`);
        setRows([]);
        setLoading(false);
        return;
      }

      const mapped: UIApplicant[] = (applicants ?? []).map((a: DBApplicant) => ({
        id: a.id,
        jobTitle: a.job_title,
        name: a.full_name,
        compatibility: a.compatibility,
        status: a.status,
      }));

      setRows(mapped);
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [jobId, titleFromQuery]);

  const visible = useMemo(() => {
    return rows.filter((r) => {
      const matchesQ = r.name.toLowerCase().includes((search ?? "").toLowerCase());
      const matchesS = statusFilter ? r.status === statusFilter : true;
      const matchesD = decisionFilter ? r.decision === decisionFilter : true;
      return matchesQ && matchesS && matchesD;
    });
  }, [rows, search, statusFilter, decisionFilter]);

  const setDecision = (id: string, d: Exclude<UIApplicant["decision"], undefined>) => {
    // UI-only (not persisted)
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, decision: d } : r)));
  };

  if (loading) {
    return <div className="bg-white rounded-lg border border-gray-200 p-6">Loading applicants…</div>;
  }

  if (err) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 text-red-600">
        Error: {err}{" "}
        <button className="ml-2 underline" onClick={() => router.replace("/resume-ai")}>
          Go to overview
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex flex-col gap-2">
        <div className="flex items-center gap-4">
          <Link href="/resume-ai" className="inline-flex items-center gap-2 text-gray-700 hover:underline mr-2">
            ← Back
          </Link>

          <div className="text-gray-900 font-medium">Applicants — {jobTitle || "Unknown role"}</div>

          <div className="ml-auto flex items-center gap-2">
            <input
              aria-label="Search by name"
              placeholder="Search by name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm"
            />

            <select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="border border-gray-300 rounded-md px-2 py-1.5 text-sm"
            >
              {STATUS_FILTERS.map((s) => (
                <option key={s || "all"} value={s}>
                  {s || "All statuses"}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter by decision"
              value={decisionFilter}
              onChange={(e) => setDecisionFilter(e.target.value as any)}
              className="border border-gray-300 rounded-md px-2 py-1.5 text-sm"
            >
              {DECISIONS.map((d) => (
                <option key={d || "all"} value={d}>
                  {d || "All decisions"}
                </option>
              ))}
            </select>

            <button
              onClick={() => {
                setSearch("");
                setStatusFilter("");
                setDecisionFilter("");
              }}
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-6 py-3 font-medium text-gray-600 w-32">Compatibility</th>
              <th className="px-6 py-3 font-medium text-gray-600">Full Name</th>
              <th className="px-6 py-3 font-medium text-gray-600">Job Title</th>
              <th className="px-6 py-3 font-medium text-gray-600">Status</th>
              <th className="px-6 py-3 font-medium text-gray-600 text-right w-60">Action</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50 border-t">
                <td className="px-6 py-3 font-medium">{r.compatibility}%</td>
                <td className="px-6 py-3 text-gray-700">{r.name}</td>
                <td className="px-6 py-3 text-gray-600">{r.jobTitle}</td>
                <td className="px-6 py-3">
                  <Link
                    href={`/resume-ai/${jobId ?? ""}/applicant/${r.id}`}
                    className={r.status === "View" ? "text-green-700 underline" : "text-gray-700 underline"}
                  >
                    {r.status}
                  </Link>
                </td>
                <td className="px-6 py-3 text-right">
                  {r.decision ? (
                    <span
                      className={
                        "inline-block px-2 py-1 rounded-md text-sm border " +
                        (r.decision === "Approved"
                          ? "text-green-700 bg-green-50 border-green-200"
                          : "text-red-700 bg-red-50 border-red-200")
                      }
                    >
                      {r.decision}
                    </span>
                  ) : (
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => setDecision(r.id, "Approved")}
                        className="border border-green-600 text-green-700 rounded-md px-3 py-1.5 text-sm hover:bg-green-50"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => setDecision(r.id, "Declined")}
                        className="text-gray-600 underline text-sm"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}

            {visible.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                  No applicants found for “{jobTitle}”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

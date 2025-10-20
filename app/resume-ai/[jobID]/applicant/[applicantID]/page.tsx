"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";

/* ---------- Tiny SVG donut ---------- */
function Donut({ percent }: { percent: number }) {
  const p = Math.max(0, Math.min(100, percent));
  const r = 64, s = 12, c = 2 * Math.PI * r, dash = (p / 100) * c;
  return (
    <svg width="180" height="180" viewBox="0 0 180 180" className="mx-auto">
      <circle cx="90" cy="90" r={r} fill="none" stroke="#E5E7EB" strokeWidth={s} />
      <circle
        cx="90" cy="90" r={r} fill="none" stroke="#34D399" strokeWidth={s} strokeLinecap="round"
        strokeDasharray={`${dash} ${c - dash}`} transform="rotate(-90 90 90)"
      />
      <text x="90" y="96" textAnchor="middle" className="fill-gray-800" style={{ fontSize: 28, fontWeight: 700 }}>
        {Math.round(p)}%
      </text>
    </svg>
  );
}

/* ---------- Types ---------- */
type MatchRow = { match_rate: number; metrics: Record<string, number> };
type ApplicantRow = {
  id: string;
  job_id: string | number;        // bigint may come back as string
  full_name: string | null;
  job_title: string | null;
  resume_text: string | null;
  decision: "Approved" | "Declined" | null;
  status: "View" | "Viewed" | null;
};
type OpeningRow = { title: string | null };

/* ---------- Page ---------- */
export default function Page() {
  // IMPORTANT: use your folder param names
  const { jobID, applicantID } = useParams<{ jobID: string; applicantID: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [savingDecision, setSavingDecision] = useState<null | "Approved" | "Declined">(null);
  const [err, setErr] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [match, setMatch] = useState<MatchRow | null>(null);

  const jobIdNum = useMemo(() => Number(jobID), [jobID]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setErr(null);

      // 1) Applicant
      const { data: app, error: aErr } = await supabase
        .from("resumeai_applicants")
        .select("id, job_id, full_name, job_title, resume_text, decision, status")
        .eq("id", applicantID)
        .maybeSingle<ApplicantRow>();

      if (!mounted) return;

      if (aErr || !app) {
        setErr(aErr?.message || "Applicant not found");
        setLoading(false);
        return;
      }

      const actualJobId = Number(app.job_id);
      if (Number.isFinite(actualJobId) && actualJobId !== jobIdNum) {
        // Canonicalize the URL if mismatch
        router.replace(`/resume-ai/${actualJobId}/applicant/${app.id}`);
        return;
      }

      setName(app.full_name ?? "Unknown Applicant");
      setJobTitle(app.job_title ?? "");
      setResumeText(app.resume_text ?? "");

      // 2) Opening (title only for UI)
      const { data: opening } = await supabase
        .from("job_openings")
        .select("title")
        .eq("job_id", actualJobId || jobIdNum)
        .maybeSingle<OpeningRow>();
      if (opening?.title) setJobTitle(opening.title ?? app.job_title ?? "");

      // 3) Latest match (or score now)
      const { data: matches } = await supabase
        .from("resumeai_matches")
        .select("match_rate, metrics, scored_at")
        .eq("applicant_id", app.id)
        .order("scored_at", { ascending: false })
        .limit(1);

      let currentMatch: MatchRow | null = (matches?.[0] as MatchRow) ?? null;

      if (!currentMatch) {
        const res = await fetch("/api/ats/score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ applicantId: app.id }),
        });
        if (res.ok) {
          const j = await res.json();
          currentMatch = { match_rate: j.matchRate, metrics: j.metrics };
        } else {
          const j = await res.json().catch(() => ({}));
          console.warn("Scoring failed:", j?.error || res.statusText);
        }
      }

      if (!mounted) return;
      setMatch(currentMatch);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [applicantID, jobIdNum, router]);

  async function handleDecision(next: "Approved" | "Declined") {
    setSavingDecision(next);
    const { error } = await supabase
      .from("resumeai_applicants")
      .update({ decision: next })
      .eq("id", applicantID);
    if (error) alert(`Failed to set decision: ${error.message}`);
    setSavingDecision(null);
  }

  const metricsPairs = useMemo(
    () => Object.entries(match?.metrics ?? {}).map(([label, value]) => ({ label, value: Math.round(Number(value || 0)) })),
    [match]
  );

  if (loading) return <div className="bg-white rounded-lg border border-gray-200 p-6">Loading applicant…</div>;

  if (err) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 text-red-600">
        Error: {err}{" "}
        <Link href={`/resume-ai/${jobID}`} className="ml-2 underline">
          Back to applicants
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/resume-ai/${jobID}`} className="inline-flex items-center gap-2 text-gray-700 hover:underline">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900">Applicant AI Scan</h1>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="border-green-600 text-green-700 hover:bg-green-50"
            disabled={savingDecision !== null}
            onClick={() => handleDecision("Approved")}
          >
            {savingDecision === "Approved" ? "Saving…" : "Approve"}
          </Button>
          <Button
            variant="outline"
            className="border-red-600 text-red-700 hover:bg-red-50"
            disabled={savingDecision !== null}
            onClick={() => handleDecision("Declined")}
          >
            {savingDecision === "Declined" ? "Saving…" : "Decline"}
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Resume */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
          <div className="mb-4">
            <div className="text-lg font-semibold text-gray-900">{name || "Unknown Applicant"}</div>
            <div className="text-gray-600">{jobTitle || "Unknown Role"}</div>
          </div>

          {/* Upload form for /api/resume/upload */}
          <form action="/api/resume/upload" method="POST" encType="multipart/form-data" className="flex items-center gap-3 mb-4">
            <input type="hidden" name="jobId" value={jobID} />
            <input type="hidden" name="applicantId" value={applicantID} />
            <input type="file" name="file" accept=".pdf,.docx,.txt" className="text-sm" />
            <Button type="submit" variant="outline" className="text-gray-700">Upload / Replace Resume</Button>
          </form>

          <div className="border rounded-md">
            <div className="p-6 bg-white">
              <div className="mx-auto max-w-[700px] border rounded-md">
                <div className="p-6">
                  <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800 leading-6">
                    {resumeText || "No resume text available yet. Upload a PDF/DOCX/TXT to extract text."}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Scan */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-lg font-semibold text-gray-900">Match rate</div>
            <Button
              variant="outline"
              className="text-gray-700"
              onClick={async () => {
                const res = await fetch("/api/ats/score", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ applicantId: applicantID }),
                });
                if (res.ok) {
                  const j = await res.json();
                  setMatch({ match_rate: j.matchRate, metrics: j.metrics });
                } else {
                  const j = await res.json().catch(() => ({}));
                  alert(j.error || "Failed to re-score");
                }
              }}
            >
              Re-score
            </Button>
          </div>

          <Donut percent={match?.match_rate ?? 0} />

          <ul className="mt-6 space-y-3">
            {metricsPairs.length > 0 ? (
              metricsPairs.map((m) => (
                <li key={m.label} className="flex items-center justify-between text-gray-700">
                  <span>{m.label}:</span>
                  <span className="font-medium">{m.value}%</span>
                </li>
              ))
            ) : (
              <li className="text-gray-500">No metrics yet. Upload a resume and click Re-score.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

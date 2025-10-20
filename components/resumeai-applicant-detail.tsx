// app/resume-ai/[jobId]/applicant/[id]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";

/* ---------- Tiny SVG donut for the match rate ---------- */
function Donut({ percent }: { percent: number }) {
  const radius = 64;
  const stroke = 12;
  const c = 2 * Math.PI * radius;
  const dash = (Math.max(0, Math.min(100, percent)) / 100) * c;
  return (
    <svg width="180" height="180" viewBox="0 0 180 180" className="mx-auto">
      <circle cx="90" cy="90" r={radius} fill="none" stroke="#E5E7EB" strokeWidth={stroke} />
      <circle
        cx="90"
        cy="90"
        r={radius}
        fill="none"
        stroke="#34D399"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${c - dash}`}
        transform="rotate(-90 90 90)"
      />
      <text x="90" y="96" textAnchor="middle" className="fill-gray-800" style={{ fontSize: 28, fontWeight: 700 }}>
        {Math.round(percent)}%
      </text>
    </svg>
  );
}

/* ---------- Types ---------- */
type MatchRow = { match_rate: number; metrics: Record<string, number> };
type ApplicantRow = {
  id: string;
  job_id: string | number; // bigint may come back as string
  full_name: string | null;
  job_title: string | null;
  resume_text: string | null;
  decision: "Approved" | "Declined" | null;
  status: "View" | "Viewed" | null;
};
type OpeningRow = { title: string | null };

/* ---------- Page ---------- */
export default function ResumeAIApplicantDetailPage() {
  const { jobId: jobIdParam, id: applicantId } = useParams<{ jobId: string; id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [savingDecision, setSavingDecision] = useState<null | "Approved" | "Declined">(null);
  const [err, setErr] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [match, setMatch] = useState<MatchRow | null>(null);

  const jobIdNum = useMemo(() => Number(jobIdParam), [jobIdParam]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      setErr(null);

      // 1) Load applicant
      const { data: app, error: aErr } = await supabase
        .from("resumeai_applicants")
        .select("id, job_id, full_name, job_title, resume_text, decision, status")
        .eq("id", applicantId)
        .maybeSingle<ApplicantRow>();

      if (!mounted) return;

      if (aErr || !app) {
        setErr(aErr?.message || "Applicant not found");
        setLoading(false);
        return;
      }

      const actualJobId = Number(app.job_id);
      if (!Number.isFinite(actualJobId) || actualJobId !== jobIdNum) {
        // If route jobId and record job_id disagree, prefer DB and redirect to canonical route
        router.replace(`/resume-ai/${actualJobId}/applicant/${app.id}`);
        return;
      }

      setName(app.full_name ?? "Unknown Applicant");
      setJobTitle(app.job_title ?? "");
      setResumeText(app.resume_text ?? "");

      // 2) Load opening title (optional)
      const { data: opening } = await supabase
        .from("job_openings")
        .select("title")
        .eq("job_id", actualJobId)
        .maybeSingle<OpeningRow>();

      if (opening?.title) setJobTitle(opening.title ?? app.job_title ?? "");

      // 3) Try latest match
      const { data: matches, error: mErr } = await supabase
        .from("resumeai_matches")
        .select("match_rate, metrics, scored_at")
        .eq("applicant_id", app.id)
        .order("scored_at", { ascending: false })
        .limit(1);

      if (!mounted) return;

      if (mErr) {
        setErr(mErr.message);
        setLoading(false);
        return;
      }

      let currentMatch: MatchRow | null = (matches?.[0] as MatchRow) ?? null;

      // 4) If no match yet, or resume_text exists but is new, compute now
      if (!currentMatch) {
        const res = await fetch("/api/ats/score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ applicantId }),
        });
        if (res.ok) {
          const j = await res.json();
          currentMatch = { match_rate: j.matchRate, metrics: j.metrics };
        } else {
          // Don't hard fail the page; just show resume without a score
          const j = await res.json().catch(() => ({}));
          console.warn("Scoring failed:", j?.error || res.statusText);
        }
      }

      setMatch(currentMatch);
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [applicantId, jobIdNum, router]);

  async function handleDecision(next: "Approved" | "Declined") {
    if (!applicantId) return;
    setSavingDecision(next);
    const { error } = await supabase
      .from("resumeai_applicants")
      .update({ decision: next })
      .eq("id", applicantId);
    if (error) {
      alert(`Failed to set decision: ${error.message}`);
    } else {
      // Soft update UI state
      // (We don't keep local decision in state separately; refetching isn't necessary for MVP)
    }
    setSavingDecision(null);
  }

  const metricsPairs = useMemo(
    () =>
      Object.entries(match?.metrics ?? {}).map(([label, value]) => ({
        label,
        value: Math.round(Number(value || 0)),
      })),
    [match]
  );

  if (loading) {
    return <div className="bg-white rounded-lg border border-gray-200 p-6">Loading applicant…</div>;
  }

  if (err) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 text-red-600">
        Error: {err}{" "}
        <Link href={`/resume-ai/${jobIdNum}`} className="ml-2 underline">
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
          <Link href={`/resume-ai/${jobIdNum}`} className="inline-flex items-center gap-2 text-gray-700 hover:underline">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900">Applicant AI Scan</h1>
        </div>

        {/* Quick actions */}
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

          {/* Optional: simple upload form (works with /api/resume/upload) */}
          <form
            action="/api/resume/upload"
            method="POST"
            encType="multipart/form-data"
            className="flex items-center gap-3 mb-4"
          >
            <input type="hidden" name="jobId" value={jobIdNum} />
            <input type="hidden" name="applicantId" value={String(applicantId)} />
            <input type="file" name="file" accept=".pdf,.docx,.txt" className="text-sm" />
            <Button type="submit" variant="outline" className="text-gray-700">
              Upload / Replace Resume
            </Button>
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
                  body: JSON.stringify({ applicantId }),
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

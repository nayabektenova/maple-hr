// components/resumeai-applicant-detail.tsx
// Step 4b: Adds signed download link for the original resume file stored in Supabase Storage.

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";

/* ---------- Tiny SVG donut ---------- */
function Donut({ percent }: { percent: number }) {
  const radius = 64;
  const stroke = 12;
  const c = 2 * Math.PI * radius;
  const p = Math.max(0, Math.min(100, Number.isFinite(percent) ? percent : 0));
  const dash = (p / 100) * c;
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
        {Math.round(p)}%
      </text>
    </svg>
  );
}

type MatchRow = { match_rate: number; metrics: Record<string, number> };
type ApplicantRow = {
  id: string;
  job_id: string | number;
  full_name: string | null;
  job_title: string | null;
  resume_text: string | null;
  decision: "Approved" | "Declined" | null;
  status: "View" | "Viewed" | null;
  // NEW: storage metadata for signed download
  storage_bucket: string | null;
  storage_path: string | null;
  mime_type: string | null;
  file_size: number | null;
  uploaded_at?: string | null;
};
type OpeningRow = { title: string | null };

export function ResumeAIApplicantDetail() {
  const { jobID, applicantID } = useParams<{ jobID: string; applicantID: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [savingDecision, setSavingDecision] = useState<null | "Approved" | "Declined">(null);
  const [err, setErr] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [resumeText, setResumeText] = useState("");

  // NEW: keep file meta + signed URL
  const [fileMeta, setFileMeta] = useState<{
    bucket: string | null;
    path: string | null;
    mime: string | null;
    size: number | null;
    uploadedAt: string | null;
  }>({ bucket: null, path: null, mime: null, size: null, uploadedAt: null });
  const [downloadUrl, setDownloadUrl] = useState<string>("");

  const [match, setMatch] = useState<MatchRow | null>(null);

  const jobIdNum = useMemo(() => {
    const n = Number(jobID);
    return Number.isFinite(n) ? n : NaN;
  }, [jobID]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setErr(null);

      if (!applicantID) {
        setErr("Missing applicant id in route.");
        setLoading(false);
        return;
      }

      // SELECT now includes storage_* fields
      const { data: app, error: aErr } = await supabase
        .from("resumeai_applicants")
        .select(
          "id, job_id, full_name, job_title, resume_text, decision, status, storage_bucket, storage_path, mime_type, file_size, uploaded_at"
        )
        .eq("id", applicantID)
        .maybeSingle<ApplicantRow>();

      if (!mounted) return;

      if (aErr || !app) {
        setErr(aErr?.message || "Applicant not found");
        setLoading(false);
        return;
      }

      const actualJobId = Number(app.job_id);
      if (!Number.isFinite(actualJobId)) {
        setErr("Invalid job_id on applicant record.");
        setLoading(false);
        return;
      }
      if (Number.isFinite(jobIdNum) && actualJobId !== jobIdNum) {
        router.replace(`/resume-ai/${actualJobId}/applicant/${app.id}`);
        return;
      }

      setName(app.full_name ?? "Unknown Applicant");
      setJobTitle(app.job_title ?? "");
      setResumeText(app.resume_text ?? "");

      // Store file meta for later display + signed URL
      setFileMeta({
        bucket: app.storage_bucket,
        path: app.storage_path,
        mime: app.mime_type,
        size: app.file_size,
        uploadedAt: app.uploaded_at ?? null,
      });

      // If a file exists, mint a short-lived signed URL for download
      if (app.storage_bucket && app.storage_path) {
        const { data, error } = await supabase.storage
          .from(app.storage_bucket)
          .createSignedUrl(app.storage_path, 600); // 10 minutes
        if (!error && data?.signedUrl) {
          setDownloadUrl(data.signedUrl);
        } else {
          setDownloadUrl("");
        }
      } else {
        setDownloadUrl("");
      }

      // Optional: get canonical job title from openings
      const { data: opening } = await supabase
        .from("job_openings")
        .select("title")
        .eq("job_id", actualJobId)
        .maybeSingle<OpeningRow>();

      if (!mounted) return;

      if (opening?.title) setJobTitle(opening.title ?? app.job_title ?? "");

      // Load latest match
      const { data: matches, error: mErr } = await supabase
        .from("resumeai_matches")
        .select("match_rate, metrics, scored_at")
        .eq("applicant_id", app.id)
        .order("scored_at", { ascending: false })
        .limit(1);

      if (mErr) console.warn("Failed to load match:", mErr.message);
      let currentMatch: MatchRow | null = (matches?.[0] as MatchRow) ?? null;

      // If no match yet, try on-demand scoring
      if (!currentMatch) {
        try {
          const res = await fetch("/api/ats/score", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ applicantId: applicantID }),
          });
          if (res.ok) {
            const j = await res.json();
            currentMatch = { match_rate: j.matchRate, metrics: j.metrics };
          }
        } catch {}
      }

      if (mounted) {
        setMatch(currentMatch);
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [applicantID, jobIdNum, router]);

  // Re-mint signed URL manually (e.g., if expired)
  async function refreshDownloadUrl() {
    if (!fileMeta.bucket || !fileMeta.path) return;
    const { data, error } = await supabase.storage.from(fileMeta.bucket).createSignedUrl(fileMeta.path, 600);
    if (!error && data?.signedUrl) setDownloadUrl(data.signedUrl);
  }

  async function handleDecision(next: "Approved" | "Declined") {
    if (!applicantID) return;
    setSavingDecision(next);
    const { error } = await supabase.from("resumeai_applicants").update({ decision: next }).eq("id", applicantID);
    if (error) alert(`Failed to set decision: ${error.message}`);
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

  if (loading) return <div className="bg-white rounded-lg border border-gray-200 p-6">Loading applicant…</div>;

  if (err) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 text-red-600">
        Error: {err}{" "}
        <Link href={`/resume-ai/${Number.isFinite(jobIdNum) ? jobIdNum : ""}`} className="ml-2 underline">
          Back to applicants
        </Link>
      </div>
    );
  }

  const hasFile = Boolean(fileMeta.bucket && fileMeta.path);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/resume-ai/${Number.isFinite(jobIdNum) ? jobIdNum : ""}`}
            className="inline-flex items-center gap-2 text-gray-700 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900">Applicant AI Scan</h1>
        </div>

        <div className="flex items-center gap-3">
          {/* NEW: Download original resume button */}
          {hasFile && downloadUrl && (
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-gray-300 rounded-md px-3 py-1.5 text-sm hover:bg-gray-50"
              title="Download original resume"
            >
              <Download className="h-4 w-4" />
              Download resume
            </a>
          )}
          {hasFile && !downloadUrl && (
            <Button variant="outline" className="text-gray-700" onClick={refreshDownloadUrl}>
              Get download link
            </Button>
          )}

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
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold text-gray-900">{name || "Unknown Applicant"}</div>
                <div className="text-gray-600">{jobTitle || "Unknown Role"}</div>
              </div>

              {/* Tiny file meta */}
              {hasFile && (
                <div className="text-xs text-gray-500 text-right">
                  <div>File: {fileMeta.path?.split("/").pop()}</div>
                  {fileMeta.mime && <div>Type: {fileMeta.mime}</div>}
                  {fileMeta.size != null && <div>Size: {(fileMeta.size / 1024).toFixed(1)} KB</div>}
                </div>
              )}
            </div>
          </div>

          {/* Upload/Replace form */}
          <form action="/api/resume/upload" method="POST" encType="multipart/form-data" className="flex items-center gap-3 mb-4">
            <input type="hidden" name="jobId" value={Number.isFinite(jobIdNum) ? jobIdNum : 0} />
            <input type="hidden" name="applicantId" value={String(applicantID)} />
            <input type="file" name="file" accept=".pdf" className="text-sm" />
            <Button type="submit" variant="outline" className="text-gray-700">
              Upload / Replace PDF
            </Button>
          </form>

          <div className="border rounded-md">
            <div className="p-6 bg-white">
              <div className="mx-auto max-w-[700px] border rounded-md">
                <div className="p-6">
                  <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800 leading-6">
                    {resumeText || "No resume text available yet. Upload a PDF to extract text, then click Re-score."}
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
                try {
                  const res = await fetch("/api/ats/score", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ applicantId: applicantID }),
                  });
                  if (res.ok) {
                    const j = await res.json();
                    setMatch({ match_rate: j.matchRate, metrics: j.metrics });
                    // after scoring, you might also want to refresh resumeText if it was just parsed on demand
                  } else {
                    const j = await res.json().catch(() => ({}));
                    alert(j.error || "Failed to re-score");
                  }
                } catch (e) {
                  alert("Failed to re-score");
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

// Also default-export so you can import either way
export default ResumeAIApplicantDetail;

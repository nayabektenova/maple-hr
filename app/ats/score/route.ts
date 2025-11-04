import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

async function parsePdf(bytes: Uint8Array): Promise<string> {
  const pdfParse = (await import("pdf-parse")).default as any;
  const out = await pdfParse(Buffer.from(bytes));
  return out?.text || "";
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// trivial tokenizer for demo scoring
function tokenize(s: string) {
  return (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9+.# ]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function score(resumeText: string, jobText: string) {
  const r = new Set(tokenize(resumeText));
  const j = new Set(tokenize(jobText));

  let overlap = 0;
  for (const t of j) if (r.has(t)) overlap++;

  const matchRate = j.size ? Math.round((overlap / j.size) * 100) : 0;
  // some toy “metrics”
  const metrics = {
    "Keyword overlap": matchRate,
    "Resume length (tokens)": tokenize(resumeText).length,
    "JD length (tokens)": tokenize(jobText).length,
  };
  return { matchRate, metrics };
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const applicantId: string = body?.applicantId;

    if (!applicantId) {
      return NextResponse.json({ error: "Missing applicantId" }, { status: 400 });
    }

    // 1) Load applicant
    const applicantQ = await supabaseAdmin
      .from("resumeai_applicants")
      .select("id, job_id, job_title, resume_text, storage_bucket, storage_path")
      .eq("id", applicantId)
      .maybeSingle();
    if (applicantQ.error || !applicantQ.data) {
      throw new Error(applicantQ.error?.message || "Applicant not found");
    }
    const app = applicantQ.data as {
      id: string;
      job_id: number | string;
      job_title: string | null;
      resume_text: string | null;
      storage_bucket: string | null;
      storage_path: string | null;
    };
    const jobId = Number(app.job_id);

    // 2) Load job opening (use title + description if you have it)
    const jobQ = await supabaseAdmin
      .from("job_openings")
      .select("title, description, department")
      .eq("job_id", jobId)
      .maybeSingle();
    if (jobQ.error || !jobQ.data) {
      throw new Error(jobQ.error?.message || "Opening not found");
    }
    const jdText =
      [jobQ.data.title, jobQ.data.description, jobQ.data.department].filter(Boolean).join(" ") ||
      app.job_title ||
      "";

    // 3) Ensure we have resume text; if missing, fetch & parse the PDF
    let resumeText = app.resume_text || "";
    if (!resumeText && app.storage_bucket && app.storage_path) {
      const dl = await supabaseAdmin.storage.from(app.storage_bucket).download(app.storage_path);
      if (dl.error) throw dl.error;
      const buf = new Uint8Array(await dl.data.arrayBuffer());
      resumeText = await parsePdf(buf);
      // cache it on the applicant row for faster subsequent scoring
      await supabaseAdmin.from("resumeai_applicants").update({ resume_text: resumeText }).eq("id", app.id);
    }

    // 4) Compute match
    const { matchRate, metrics } = score(resumeText || "", jdText || "");

    // 5) Persist the score
    const ins = await supabaseAdmin.from("resumeai_matches").insert({
      applicant_id: app.id,
      match_rate: matchRate,
      metrics,
    });
    if (ins.error) throw ins.error;

    return NextResponse.json({ matchRate, metrics });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Scoring failed" }, { status: 500 });
  }
}

// app/api/resume/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import pdf from "pdf-parse";
import mammoth from "mammoth";

export const runtime = "nodejs"; // IMPORTANT: we need Node APIs for pdf-parse/mammoth

export async function POST(req: NextRequest) {
  const supabase = supabaseServer();

  // 1) Parse form-data
  const form = await req.formData();
  const file = form.get("file") as File | null;
  const jobIdRaw = form.get("jobId");
  const applicantId = String(form.get("applicantId") || "");

  if (!file || !jobIdRaw || !applicantId) {
    return NextResponse.json({ error: "Missing file, jobId or applicantId" }, { status: 400 });
  }

  const jobId = Number(jobIdRaw);
  if (!Number.isFinite(jobId)) {
    return NextResponse.json({ error: "Invalid jobId" }, { status: 400 });
  }

  // 2) Basic validations
  const maxBytes = 10 * 1024 * 1024; // 10 MB
  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.byteLength > maxBytes) {
    return NextResponse.json({ error: "File too large (max 10 MB)" }, { status: 413 });
  }

  const name = (file.name || "resume").toLowerCase();
  const mime = file.type || "application/octet-stream";

  // 3) Extract text
  let resumeText = "";
  try {
    if (name.endsWith(".pdf") || mime === "application/pdf") {
      const parsed = await pdf(buf);
      resumeText = (parsed.text || "").trim();
    } else if (name.endsWith(".docx")) {
      const parsed = await mammoth.extractRawText({ buffer: buf });
      resumeText = (parsed.value || "").trim();
    } else if (name.endsWith(".txt") || mime.startsWith("text/")) {
      resumeText = buf.toString("utf8").trim();
    } else {
      return NextResponse.json({ error: "Unsupported file type. Use PDF, DOCX, or TXT." }, { status: 415 });
    }
  } catch (e: any) {
    return NextResponse.json({ error: `Failed to extract text: ${e?.message ?? e}` }, { status: 500 });
  }

  if (!resumeText) {
    // non-OCR PDFs will produce empty text if they’re scans; that’s fine for MVP
    // (Later: add OCR with Tesseract/cloud API)
    resumeText = "";
  }

  // 4) Upload to Storage (private bucket 'resumes')
  const path = `resumes/${jobId}/${applicantId}/${Date.now()}-${name}`;
  const { error: upErr } = await supabase.storage.from("resumes").upload(path, buf, {
    contentType: mime,
    upsert: true,
  });
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  // 5) Update DB
  const { error: dbErr } = await supabase
    .from("resumeai_applicants")
    .update({
      resume_path: path,
      resume_text: resumeText,
      resume_text_updated_at: new Date().toISOString(),
    })
    .eq("id", applicantId);

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, path, bytes: buf.byteLength });
}

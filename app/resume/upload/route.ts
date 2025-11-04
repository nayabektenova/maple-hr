// app/api/resume-ai/upload/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Force Node runtime because pdf-parse needs Node APIs
export const runtime = "nodejs";
// This is dynamic (reads env, writes DB, etc.)
export const dynamic = "force-dynamic";

// CJS package: load dynamically at runtime
async function parsePdfToText(bytes: Uint8Array): Promise<string> {
  const pdfParse = (await import("pdf-parse")).default as any;
  const out = await pdfParse(Buffer.from(bytes));
  return out?.text || "";
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // server-only (DO NOT expose to client)
);

// Handy probe so visiting the URL in a browser doesn't 404
export async function GET() {
  return NextResponse.json({ ok: true, route: "/api/resume-ai/upload", method: "POST only for uploads" });
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const jobId = Number(form.get("jobId"));
    const applicantId = String(form.get("applicantId") || "");

    if (!file || !jobId || !applicantId) {
      return NextResponse.json({ error: "Missing file/jobId/applicantId" }, { status: 400 });
    }

    const arrayBuf = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuf);

    const bucket = "resumes";
    const ext = (file.name.split(".").pop() || "pdf").toLowerCase();
    const path = `jobs/${jobId}/applicants/${applicantId}.${ext}`;

    // 1) Upload to Storage (private bucket)
    const up = await supabaseAdmin.storage.from(bucket).upload(path, bytes, {
      upsert: true,
      contentType: file.type || "application/pdf",
    });
    if (up.error) throw up.error;

    // 2) Extract text from PDF
    let resumeText = "";
    try {
      resumeText = await parsePdfToText(bytes);
    } catch (e) {
      console.warn("PDF parse failed:", e);
    }

    // 3) Save metadata + text on applicant row
    const upd = await supabaseAdmin
      .from("resumeai_applicants")
      .update({
        storage_bucket: bucket,
        storage_path: path,
        mime_type: file.type || "application/pdf",
        file_size: file.size,
        uploaded_at: new Date().toISOString(),
        resume_text: resumeText || null,
      })
      .eq("id", applicantId);
    if (upd.error) throw upd.error;

    return NextResponse.json({ ok: true, hasText: Boolean(resumeText) });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Upload failed" }, { status: 500 });
  }
}

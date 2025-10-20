// app/api/resume/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs"; // pdf-parse & mammoth need Node runtime

// Helpful message for accidental GETs (e.g., opening the URL directly)
export async function GET() {
  return NextResponse.json(
    { error: "Use POST with multipart/form-data (file, jobId, applicantId)" },
    { status: 405 }
  );
}

export async function POST(req: NextRequest) {
  const supabase = supabaseServer();

  try {
    // Dynamically import CJS libs to avoid bundling/interop issues
    const pdfParse = (await import("pdf-parse")).default as (
      b: Buffer
    ) => Promise<{ text: string }>;
    const mammothMod: any = await import("mammoth");
    const extractRawText: (args: { buffer: Buffer }) => Promise<{ value: string }> =
      mammothMod?.default?.extractRawText || mammothMod?.extractRawText;

    // 1) Parse multipart/form-data
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const jobIdRaw = form.get("jobId");
    const applicantId = String(form.get("applicantId") || "");

    if (!file || !jobIdRaw || !applicantId) {
      return NextResponse.json(
        { error: "Missing file, jobId or applicantId" },
        { status: 400 }
      );
    }

    const jobId = Number(jobIdRaw);
    if (!Number.isFinite(jobId)) {
      return NextResponse.json({ error: "Invalid jobId" }, { status: 400 });
    }

    // 2) Validate & buffer
    const maxBytes = 10 * 1024 * 1024; // 10 MB
    const buf = Buffer.from(await file.arrayBuffer());
    if (buf.byteLength > maxBytes) {
      return NextResponse.json(
        { error: "File too large (max 10 MB)" },
        { status: 413 }
      );
    }

    const originalName = (file.name || "resume").toLowerCase();
    const mime = file.type || "application/octet-stream";

    // 3) Extract plain text (PDF/DOCX/TXT)
    let resumeText = "";
    try {
      if (originalName.endsWith(".pdf") || mime === "application/pdf") {
        const parsed = await pdfParse(buf);
        resumeText = (parsed?.text || "").trim();
      } else if (originalName.endsWith(".docx")) {
        const parsed = await extractRawText({ buffer: buf });
        resumeText = (parsed?.value || "").trim();
      } else if (originalName.endsWith(".txt") || mime.startsWith("text/")) {
        resumeText = buf.toString("utf8").trim();
      } else {
        return NextResponse.json(
          { error: "Unsupported file type. Use PDF, DOCX, or TXT." },
          { status: 415 }
        );
      }
    } catch (err: any) {
      console.error("Text extraction failed:", err);
      return NextResponse.json(
        { error: `Failed to extract text: ${err?.message ?? err}` },
        { status: 500 }
      );
    }

    // Non-OCR PDFs may yield empty text; acceptable for MVP
    if (!resumeText) resumeText = "";

    // 4) Upload file to private Storage bucket 'resumes'
    const safeName = originalName.replace(/[^\w.\-+]+/g, "_");
    const path = `resumes/${jobId}/${applicantId}/${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from("resumes")
      .upload(path, buf, { contentType: mime, upsert: true });

    if (uploadError) {
      console.error("Storage upload failed:", uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // 5) Update applicant record
    const { error: dbError } = await supabase
      .from("resumeai_applicants")
      .update({
        resume_path: path,
        resume_text: resumeText,
        resume_text_updated_at: new Date().toISOString(),
      })
      .eq("id", applicantId);

    if (dbError) {
      console.error("DB update failed:", dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      path,
      bytes: buf.byteLength,
      message: "Resume uploaded and parsed successfully",
    });
  } catch (e: any) {
    console.error("Unhandled upload error:", e);
    return NextResponse.json(
      { error: e?.message ?? "Unexpected server error" },
      { status: 500 }
    );
  }
}

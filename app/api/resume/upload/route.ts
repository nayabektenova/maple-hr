// app/api/resume/upload/route.ts
"use server";

import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import pdf from "pdf-parse";
import mammoth from "mammoth";

export const runtime = "nodejs"; // Required because pdf-parse & mammoth need Node APIs

export async function POST(req: NextRequest) {
  const supabase = supabaseServer();

  try {
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

    // 2) Validate file size
    const maxBytes = 10 * 1024 * 1024; // 10 MB limit
    const buf = Buffer.from(await file.arrayBuffer());
    if (buf.byteLength > maxBytes) {
      return NextResponse.json(
        { error: "File too large (max 10 MB)" },
        { status: 413 }
      );
    }

    const name = (file.name || "resume").toLowerCase();
    const mime = file.type || "application/octet-stream";

    // 3) Extract plain text
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
        return NextResponse.json(
          { error: "Unsupported file type. Use PDF, DOCX, or TXT." },
          { status: 415 }
        );
      }
    } catch (err: any) {
      return NextResponse.json(
        { error: `Failed to extract text: ${err?.message ?? err}` },
        { status: 500 }
      );
    }

    // Non-OCR PDFs will yield empty text; fine for MVP
    if (!resumeText) resumeText = "";

    // 4) Upload to Storage bucket “resumes”
    const path = `resumes/${jobId}/${applicantId}/${Date.now()}-${name}`;
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

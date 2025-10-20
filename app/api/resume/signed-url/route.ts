import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: NextRequest) {
  const supabase = supabaseServer();
  const { path } = await req.json();
  if (!path) return NextResponse.json({ error: "Missing path" }, { status: 400 });

  const { data, error } = await supabase.storage.from("resumes").createSignedUrl(path, 60); // 60s
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ url: data.signedUrl });
}

insert into public.job_openings
  (job_id, title, department, job_type, openings, applicants, jd_text, jd_updated_at)
values
  (101, 'Frontend Engineer', 'Engineering', 'Full-Time', 2, 0,
   'We need a Frontend Engineer with React, Next.js, TypeScript, HTML, CSS, Tailwind, Scrum.',
   now())
on conflict (job_id) do update
set jd_text = excluded.jd_text,
    jd_updated_at = now();

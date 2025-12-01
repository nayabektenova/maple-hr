// app/resume-ai/[jobID]/applicant/[applicantID]/page.tsx
"use client";
import { ResumeAIApplicantDetail } from "@/components/resumeai-applicant-detail";

export default function ResumeAIApplicantDetailPage() {
  return (
    <div className="p-6">
      <ResumeAIApplicantDetail />
    </div>
  );
}

import { ResumeAIApplicants } from "@/components/resumeai-applicants"

export default function ApplicantsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Applicants</h1>
      </div>
      <ResumeAIApplicants />
    </div>
  )
}

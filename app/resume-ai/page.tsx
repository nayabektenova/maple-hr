import { ResumeAIJobOpenings } from "@/components/resumeai-openings"

export default function ResumeAIPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Job Openings</h1>
      </div>
      <ResumeAIJobOpenings />
    </div>
  )
}

import { SurveyList } from "@/components/survey-list"

export default function SurveyPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Survey</h1>
      </div>
      <SurveyList />
    </div>
  )
}

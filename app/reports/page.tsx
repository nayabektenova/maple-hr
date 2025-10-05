// these are the pages done by naya 
import { ReportsOverview } from "@/components/reports-overview"

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>
      </div>

      {/* White box container to match your other pages */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <ReportsOverview />
      </div>
    </div>
  )
}

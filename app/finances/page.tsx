import { FinancesOverview } from "@/components/finances-overview"

export default function FinancesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Finances</h1>
      </div>

      {/* White box container to match the rest of your app */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <FinancesOverview />
      </div>
    </div>
  )
}

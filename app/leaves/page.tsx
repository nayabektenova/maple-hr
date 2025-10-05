// these are the pages done by naya
import { LeavesList } from "@/components/leaves-list"

export default function LeavesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Leaves</h1>
      </div>
      <LeavesList />
    </div>
  )
}

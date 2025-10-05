import { ScheduleList } from "@/components/schedule-list"

export default function SchedulePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Schedule</h1>
      </div>
      <ScheduleList />
    </div>
  )
}
// these are the code done by naya benkotava
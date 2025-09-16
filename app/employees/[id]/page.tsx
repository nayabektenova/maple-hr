import { EmployeeInformation } from "@/components/employee-information"

interface EmployeePageProps {
  params: {
    id: string
  }
}

export default function EmployeePage({ params }: EmployeePageProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Employee Information</h1>
      </div>
      <EmployeeInformation employeeId={params.id} />
    </div>
  )
}

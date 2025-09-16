import { EditEmployeeForm } from "@/components/edit-employee-form"

interface EditEmployeePageProps {
  params: {
    id: string
  }
}

export default function EditEmployeePage({ params }: EditEmployeePageProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Edit Employee</h1>
      </div>
      <EditEmployeeForm employeeId={params.id} />
    </div>
  )
}

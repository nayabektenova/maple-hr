import { AddEmployeeForm } from "@/components/add-employee-form"

export default function AddEmployeePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Add Employee</h1>
      </div>
      <AddEmployeeForm />
    </div>
  )
}

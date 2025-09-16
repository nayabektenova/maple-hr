import { EmployeeList } from "@/components/admin-employee-list"

export default function EmployeesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Employees</h1>
      </div>
      <EmployeeList />
    </div>
  )
}

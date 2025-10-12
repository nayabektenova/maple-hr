// app/employees/hierarchy/page.tsx

import EmployeeHierarchy from "@/components/employee-hierarchy"

export default function HierarchyPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Employees Hierarchy</h1>
      <EmployeeHierarchy />
    </div>
  )
}
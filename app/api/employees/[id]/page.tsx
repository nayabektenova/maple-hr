// app/employees/[id]/page.tsx
import { EmployeeInformation } from "@/components/EmployeeInformation";

export default function EmployeePage({ params }: { params: { id: string } }) {
  return <EmployeeInformation employeeId={params.id} />;
}

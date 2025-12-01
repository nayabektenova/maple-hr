// app/api/employees/summary/utils.ts
import type { Employee } from "@/types/employee";

export type EmployeeSummary = {
  totalEmployees: number;
  newHiresThisMonth: number;
  headcountByDepartment: { department: string; headcount: number }[];
};

export function buildSummary(employees: Employee[]): EmployeeSummary {
  // move the reduce/filter logic here
}

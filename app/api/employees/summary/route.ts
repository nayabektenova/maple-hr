// app/api/employees/summary/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import type { Employee } from "@/types/employee";

type DeptMetric = { department: string; headcount: number };

export async function GET() {
  const { data, error } = await supabase
    .from("employees")
    .select("*");

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  const employees = data as Employee[];

  const totalEmployees = employees.length;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const newHiresThisMonth = employees.filter((e) => {
    if (!e.joining_date) return false;
    const d = new Date(e.joining_date);
    return d >= startOfMonth && d <= now;
  }).length;

  const headcountByDepartmentMap: Record<string, DeptMetric> = {};
  for (const e of employees) {
    const dept = e.department || "Unassigned";
    if (!headcountByDepartmentMap[dept]) {
      headcountByDepartmentMap[dept] = { department: dept, headcount: 0 };
    }
    headcountByDepartmentMap[dept].headcount += 1;
  }

  const headcountByDepartment = Object.values(headcountByDepartmentMap);

  return NextResponse.json({
    totalEmployees,
    newHiresThisMonth,
    headcountByDepartment,
  });
}

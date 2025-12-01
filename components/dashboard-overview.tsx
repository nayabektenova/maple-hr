"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Users,
  UserPlus,
  Calendar,
  TrendingUp,
  AlertCircle,
  DollarSign,
} from "lucide-react"
import { Calendar as UiCalendar } from "@/components/ui/calendar"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts"

import { useEffect, useState } from "react";

import { buildSummary } from "@/app/api/employees/summary/utils";
import sample from "./fixtures/employees.json";

test("computes total employees", () => {
  const summary = buildSummary(sample);
  expect(summary.totalEmployees).toBe(sample.length);
});

test("computes headcount by department", () => {
  const summary = buildSummary(sample);
  const dev = summary.headcountByDepartment.find(
    (d) => d.department === "Development"
  );
  expect(dev?.headcount).toBe(
    sample.filter((e) => e.department === "Development").length
  );
});


const buildStats = (summary: EmployeeSummary | null) => {
  const totalEmployees = summary?.totalEmployees ?? 0;
  const newHires = summary?.newHiresThisMonth ?? 0;

  return [
    {
      title: "Total Employees",
      value: loading ? "…" : totalEmployees.toString(),
      change: "+12%", // can adjust later if you compute real change
      changeType: "positive" as StatChangeType,
      icon: Users,
    },
    {
      title: "New Hires (this month)",
      value: loading ? "…" : newHires.toString(),
      change: "+8%",
      changeType: "positive" as StatChangeType,
      icon: UserPlus,
    },
    {
      title: "Pending Leaves",
      value: "8", // still mock for now
      change: "-2%",
      changeType: "negative" as StatChangeType,
      icon: Calendar,
    },
    {
      title: "Monthly Payroll",
      value: "$847K", // still mock
      change: "+5%",
      changeType: "positive" as StatChangeType,
      icon: DollarSign,
    },
  ];
};

const stats = buildStats(summary);

const { data, error } = await supabase
  .from("employees")
  .select("*")
  .eq("is_active", true);


type StatChangeType = "positive" | "negative";

type HeadcountByDepartment = {
  department: string;
  headcount: number;
};

type EmployeeSummary = {
  totalEmployees: number;
  newHiresThisMonth: number;
  headcountByDepartment: HeadcountByDepartment[];
};

export function DashboardOverview() {
  const [summary, setSummary] = useState<EmployeeSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await fetch("/api/employees/summary");
        if (!res.ok) throw new Error("Failed to load employee summary");
        const data: EmployeeSummary = await res.json();
        setSummary(data);
      } catch (err: any) {
        setError(err.message ?? "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);
  return (
    
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Calendar className="w-4 h-4 mr-2" />
            This Month
          </Button>
          
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">
          Failed to load employee metrics: {error}
        </div>
      )}

      {/* ==== STATS ==== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">{stat.title}</CardTitle>
              <stat.icon className="w-4 h-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className={`w-3 h-3 ${stat.changeType === "positive" ? "text-green-500" : "text-red-500"}`} />
                <span className={`text-xs ${stat.changeType === "positive" ? "text-green-600" : "text-red-600"}`}>
                  {stat.change} from last month
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ==== CHART + EVENTS + QUICK ACTIONS ==== */}
      <div className="grid gap-6 grid-cols-[65%_35%]">
        {/* LEFT COLUMN (Chart + Quick Actions) */}
        <div className="space-y-6">
          {/* Bar Chart */}
          <Card className="h-[420px]">
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900">
                Headcount by Department
              </CardTitle>
              <select defaultValue="Monthly" className="text-sm border rounded-md px-2 py-1">
                <option>Yearly</option>
                <option>Monthly</option>
                <option>Weekly</option>
              </select>
            </CardHeader>
            <CardContent className="h-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={
                    summary?.headcountByDepartment ?? [
                      // optional tiny fallback if you want
                    ]
                  }
                  margin={{ top: 10, right: 20, left: 0, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#ececec" />
                  <XAxis dataKey="department" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="headcount" fill="#2EB36D" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link href="/employees/add">
                  <Button variant="outline" className="h-20 flex flex-col gap-2 bg-transparent w-full">
                    <UserPlus className="w-5 h-5" />
                    <span className="text-sm">Add Employee</span>
                  </Button>
                </Link>
                <Link href="/schedule">
                  <Button variant="outline" className="h-20 flex flex-col gap-2 bg-transparent w-full">
                    <Calendar className="w-5 h-5" />
                    <span className="text-sm">Schedule Meeting</span>
                  </Button>
                </Link>
                <Link href="/leaves">
                  <Button variant="outline" className="h-20 flex flex-col gap-2 bg-transparent w-full">
                    <AlertCircle className="w-5 h-5" />
                    <span className="text-sm">Review Leaves</span>
                  </Button>
                </Link>
                <Link href="/reports">
                  <Button variant="outline" className="h-20 flex flex-col gap-2 bg-transparent w-full">
                    <TrendingUp className="w-5 h-5" />
                    <span className="text-sm">View Reports</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN (Upcoming Events) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <UiCalendar mode="single" selected={undefined} className="w-full" />
            </div>
            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{event.title}</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      {event.date} at {event.time}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">{event.attendees}</div>
                    <div className="text-xs text-gray-500">attendees</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

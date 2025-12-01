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

const stats = [
  { title: "Total Employees", value: "247", change: "+12%", changeType: "positive" as const, icon: Users },
  { title: "New Hires", value: "23", change: "+8%", changeType: "positive" as const, icon: UserPlus },
  { title: "Pending Leaves", value: "8",  change: "-2%", changeType: "negative" as const, icon: Calendar  },
  { title: "Monthly Payroll", value: "$847K", change: "+5%", changeType: "positive" as const, icon: DollarSign },
]

const upcomingEvents = [
  { id: 1, title: "Team Building Event",  date: "Dec 15, 2024", time: "2:00 PM",  attendees: 45  },
  { id: 2, title: "Monthly All-Hands",   date: "Dec 20, 2024", time: "10:00 AM", attendees: 247 },
  { id: 3, title: "Holiday Party",        date: "Dec 22, 2024", time: "6:00 PM",  attendees: 180 },
]

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
                  data={[
                    { department: "Development",      headcount: 102 },
                    { department: "Marketing",        headcount: 56 },
                    { department: "Finance",          headcount: 35 },
                    { department: "Administration",   headcount: 28 },
                    { department: "Cybersecurity",    headcount: 12 },
                    { department: "HR",               headcount: 18 },
                    { department: "Legal",            headcount: 9  },
                    { department: "Support",          headcount: 22 },
                  ]}
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

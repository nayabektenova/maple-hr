"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  DollarSign,
  ClipboardList,
  Plane,
  Receipt,
  Clock3,
} from "lucide-react";
import { Calendar as UiCalendar } from "@/components/ui/calendar";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

// --- Mock data you can replace with real queries later ---
const stats = [
  { title: "Next Payday", value: "Oct 31", icon: DollarSign },
  { title: "PTO Balance", value: "48h", icon: Plane },
  { title: "Pending Requests", value: "2", icon: ClipboardList },
  { title: "This Week Hours", value: "37.5", icon: Clock3 },
];

const hoursData = [
  { wk: "Wk 1", hours: 38 },
  { wk: "Wk 2", hours: 39.5 },
  { wk: "Wk 3", hours: 36 },
  { wk: "Wk 4", hours: 40 },
  { wk: "Wk 5", hours: 37 },
  { wk: "Wk 6", hours: 38.5 },
  { wk: "Wk 7", hours: 35 },
  { wk: "Wk 8", hours: 37.5 },
];

const myItems = [
  { id: 1, title: "1:1 with Manager", date: "Oct 28, 2025", time: "2:00 PM" },
  { id: 2, title: "Security Training", date: "Oct 30, 2025", time: "11:00 AM" },
  { id: 3, title: "Team Sync", date: "Nov 1, 2025", time: "9:30 AM" },
];

export default function EmployeeDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">My Dashboard</h1>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Calendar className="w-4 h-4 mr-2" />
            This Month
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s) => (
          <Card key={s.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {s.title}
              </CardTitle>
              <s.icon className="w-4 h-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart + Actions + Calendar/Upcoming */}
      <div className="grid gap-6 grid-cols-[65%_35%]">
        {/* Left: Hours chart + Quick actions */}
        <div className="space-y-6">
          {/* Hours bar chart */}
          <Card className="h-[420px]">
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900">
                My Hours (Last 8 Weeks)
              </CardTitle>
              <select defaultValue="Weeks" className="text-sm border rounded-md px-2 py-1">
                <option>Weeks</option>
                <option>Months</option>
              </select>
            </CardHeader>
            <CardContent className="h-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hoursData} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ececec" />
                  <XAxis dataKey="wk" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="hours" fill="#2EB36D" radius={[4, 4, 0, 0]} />
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
                <Link href="/employeeview/pay">
                  <Button variant="outline" className="h-20 flex flex-col gap-2 bg-transparent w-full">
                    <DollarSign className="w-5 h-5" />
                    <span className="text-sm">View Pay</span>
                  </Button>
                </Link>
                <Link href="/employeeview/timeoff">
                  <Button variant="outline" className="h-20 flex flex-col gap-2 bg-transparent w-full">
                    <Plane className="w-5 h-5" />
                    <span className="text-sm">Request Time Off</span>
                  </Button>
                </Link>
                <Link href="/employeeview/submitclaim">
                  <Button variant="outline" className="h-20 flex flex-col gap-2 bg-transparent w-full">
                    <Receipt className="w-5 h-5" />
                    <span className="text-sm">Expense Claim</span>
                  </Button>
                </Link>
                <Link href="/schedule">
                  <Button variant="outline" className="h-20 flex flex-col gap-2 bg-transparent w-full">
                    <Calendar className="w-5 h-5" />
                    <span className="text-sm">My Schedule</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Calendar + Upcoming */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">My Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <UiCalendar mode="single" selected={undefined} className="w-full" />
            </div>
            <div className="space-y-4">
              {myItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{item.title}</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      {item.date} at {item.time}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Reminder</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

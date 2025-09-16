"use client"

import { useState } from "react"
import { Calendar as CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as ReTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts"

// ----- Demo data -----
const employmentTypes = [
  { name: "Full-time / Permanent", value: 34 },
  { name: "Remote / Hybrid", value: 17 },
  { name: "Contract / Freelance", value: 13 },
  { name: "Part-time", value: 17 },
  { name: "Internship", value: 9 },
  { name: "Temporary / Agency", value: 10 },
]

const availability = [
  { name: "Present On-Site", value: 40 },
  { name: "Working remotely", value: 35 },
  { name: "On leave", value: 10 },
  { name: "Absent (Unplanned)", value: 5 },
  { name: "On training / Travel", value: 5 },
  { name: "Holidays / Weekends", value: 5 },
]

const byDepartment = [
  { name: "Cybersecurity", employees: 23 },
  { name: "Development", employees: 28 },
  { name: "Marketing", employees: 17 },
  { name: "Administration", employees: 26 },
  { name: "Finance", employees: 23 },
  { name: "Maintenance", employees: 26 },
  { name: "Customer Support", employees: 26 },
  { name: "Design", employees: 24 },
]

// subtle pleasant palette
const PIE_COLORS = ["#34d399", "#a78bfa", "#f59e0b", "#60a5fa", "#f97316", "#86efac"]

function SectionCard({
  title,
  children,
  rightLabel,
  className,
}: {
  title: string
  children: React.ReactNode
  rightLabel?: string
  className?: string
}) {
  const [month, setMonth] = useState(rightLabel ?? "July 2025")
  return (
    <div className={cn("bg-white rounded-xl border border-gray-200 p-4 sm:p-6", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {rightLabel !== undefined && (
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-700 hover:bg-gray-50"
            onClick={() => setMonth((m) => (m === "July 2025" ? "June 2025" : "July 2025"))}
            title="Toggle month"
          >
            <CalendarIcon className="w-4 h-4 mr-2" />
            {month}
          </Button>
        )}
      </div>
      {children}
    </div>
  )
}

function LegendList({ items }: { items: { name: string; color: string }[] }) {
  return (
    <ul className="mt-4 grid grid-cols-2 gap-2 text-sm">
      {items.map((it) => (
        <li key={it.name} className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full" style={{ background: it.color }} />
          <span className="text-gray-700">{it.name}</span>
        </li>
      ))}
    </ul>
  )
}

export function ReportsOverview() {
  const [activeTab] = useState<"overview">("overview") // placeholder in case you add more tabs later

  return (
    <div className="space-y-6">
      {/* Top pills (Overview active; Leave present but disabled to match screenshot while keeping only Overview page) */}
      

      {/* Row of 2 pie charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <SectionCard title="Employment Types" rightLabel="July 2025">
          <div className="grid md:grid-cols-2 gap-6 items-center">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={employmentTypes}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {employmentTypes.map((entry, idx) => (
                      <Cell key={`cell-et-${idx}`} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <ReTooltip formatter={(v: number) => `${v}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <LegendList
              items={employmentTypes.map((d, i) => ({ name: d.name, color: PIE_COLORS[i % PIE_COLORS.length] }))}
            />
          </div>
        </SectionCard>

        <SectionCard title="Workforce Availability" rightLabel="July 2025">
          <div className="grid md:grid-cols-2 gap-6 items-center">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={availability}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {availability.map((entry, idx) => (
                      <Cell key={`cell-av-${idx}`} fill={PIE_COLORS[(idx + 1) % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <ReTooltip formatter={(v: number) => `${v}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <LegendList
              items={availability.map((d, i) => ({
                name: d.name,
                color: PIE_COLORS[(i + 1) % PIE_COLORS.length],
              }))}
            />
          </div>
        </SectionCard>
      </div>

      {/* Bar chart */}
      <SectionCard title="Employees by Department">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byDepartment} barCategoryGap={24}>
              <CartesianGrid vertical={false} stroke="#e5e7eb" />
              <XAxis
                dataKey="name"
                tickMargin={8}
                tick={{ fill: "#6b7280", fontSize: 12 }}
                axisLine={{ stroke: "#e5e7eb" }}
              />
              <YAxis
                tick={{ fill: "#6b7280", fontSize: 12 }}
                axisLine={{ stroke: "#e5e7eb" }}
                tickLine={{ stroke: "#e5e7eb" }}
              />
              <ReTooltip />
              <Bar dataKey="employees" radius={[6, 6, 0, 0]} fill="#34d399" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>
    </div>
  )
}

"use client"

import { useState } from "react"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Clock3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
} from "recharts"

// ---- Mock Data ----
const paymentRows = [
  { amount: 885567, month: "July 2025", status: { label: "105 Processing", kind: "processing" as const } },
  { amount: 875525, month: "June 2025", status: { label: "12 Processing",  kind: "processing" as const } },
  { amount: 912567, month: "May 2025",  status: { label: "Deposited",       kind: "ok" as const } },
  { amount: 945767, month: "April 2025", status: { label: "Deposited",       kind: "ok" as const } },
  { amount: 885243, month: "March 2025", status: { label: "Deposited",       kind: "ok" as const } },
]

const bonusRows = [
  { employee: "Joe Doe",    amount: 5000,  status: { label: "Pending approval", kind: "pending" as const } },
  { employee: "John Smith", amount: 2500,  status: { label: "Pending approval", kind: "pending" as const } },
  { employee: "Laura Porter", amount: 3400, status: { label: "Approved",         kind: "ok" as const } },
  { employee: "Bob Green",  amount: 12000, status: { label: "Denied",           kind: "denied" as const } },
  { employee: "Russel Blue", amount: 1200, status: { label: "Approved",         kind: "ok" as const } },
]

const salariesByDept = [
  { name: "Cybersecurity",     salary: 235000 },
  { name: "Development",       salary: 285000 },
  { name: "Marketing",         salary: 180000 },
  { name: "Administration",    salary: 260000 },
  { name: "Finance",           salary: 230000 },
  { name: "Maintenance",       salary: 265000 },
  { name: "Customer Support",  salary: 260000 },
  { name: "Design",            salary: 240000 },
]

// ---- Small UI helpers ----
function Section({
  title,
  right,
  children,
  className,
}: {
  title: string
  right?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("bg-white rounded-xl border border-gray-200 p-4 sm:p-6", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {right}
      </div>
      {children}
    </div>
  )
}

function Money({ value }: { value: number }) {
  return <span>${value.toLocaleString()}</span>
}

function StatusPill({
  kind,
  children,
}: {
  kind: "ok" | "denied" | "pending" | "processing"
  children: React.ReactNode
}) {
  const styles =
    kind === "ok"
      ? "text-green-700"
      : kind === "denied"
      ? "text-red-700"
      : "text-gray-700"
  const Icon =
    kind === "ok" ? CheckCircle2 : kind === "denied" ? XCircle : Clock3

  return (
    <span className={cn("inline-flex items-center gap-1.5", styles)}>
      <Icon className="h-4 w-4" />
      {children}
    </span>
  )
}

export function FinancesOverview() {
  const [range, setRange] = useState("May 2025 – Jul 2025")
  const [year, setYear] = useState(2025)
  const [monthLabel, setMonthLabel] = useState("July 2025")

  return (
    <div className="space-y-6">
      {/* Top grid: Payment Status + Bonuses */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Payment Status */}
        <Section
          title="Payment Status"
          right={
            <div className="inline-flex items-center gap-2">
              <Button variant="ghost" size="icon" aria-label="Previous">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-gray-700">{range}</span>
              <Button variant="ghost" size="icon" aria-label="Next">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          }
        >
          <div className="divide-y divide-gray-100 rounded-md border border-gray-200 overflow-hidden">
            <div className="grid grid-cols-3 text-xs font-medium text-gray-500 bg-gray-50 px-4 py-2">
              <div>Amount</div>
              <div>Month</div>
              <div className="text-right">Status</div>
            </div>
            {paymentRows.map((row, i) => (
              <div key={i} className="grid grid-cols-3 items-center px-4 py-3">
                <div className="font-medium"><Money value={row.amount} /></div>
                <div className="text-gray-700">{row.month}</div>
                <div className="text-right">
                  <StatusPill kind={row.status.kind}>{row.status.label}</StatusPill>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Bonuses */}
        <Section
          title="Bonuses"
          right={
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-700 hover:bg-gray-50"
              onClick={() => setYear((y) => (y === 2025 ? 2024 : 2025))}
            >
              <CalendarIcon className="w-4 h-4 mr-2" />
              {year}
            </Button>
          }
        >
          <div className="divide-y divide-gray-100 rounded-md border border-gray-200 overflow-hidden">
            <div className="grid grid-cols-3 text-xs font-medium text-gray-500 bg-gray-50 px-4 py-2">
              <div>Employee</div>
              <div>Amount</div>
              <div className="text-right">Status</div>
            </div>
            {bonusRows.map((row, i) => (
              <div key={i} className="grid grid-cols-3 items-center px-4 py-3">
                <div className="text-gray-800">{row.employee}</div>
                <div className="font-medium"><Money value={row.amount} /></div>
                <div className="text-right">
                  <StatusPill kind={row.status.kind}>{row.status.label}</StatusPill>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* Salaries by Department */}
      <Section
        title="Salaries by Department"
        right={
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-700 hover:bg-gray-50"
            onClick={() =>
              setMonthLabel((m) => (m === "July 2025" ? "June 2025" : "July 2025"))
            }
          >
            <CalendarIcon className="w-4 h-4 mr-2" />
            {monthLabel}
          </Button>
        }
      >
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={salariesByDept} barCategoryGap={24}>
              <CartesianGrid vertical={false} stroke="#e5e7eb" />
              <XAxis
                dataKey="name"
                tickMargin={8}
                tick={{ fill: "#6b7280", fontSize: 12 }}
                axisLine={{ stroke: "#e5e7eb" }}
              />
              <YAxis
                tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}K` : `${v}`)}
                tick={{ fill: "#6b7280", fontSize: 12 }}
                axisLine={{ stroke: "#e5e7eb" }}
                tickLine={{ stroke: "#e5e7eb" }}
              />
              <ReTooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
              <Bar dataKey="salary" radius={[6, 6, 0, 0]} fill="#34d399" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Section>
    </div>
  )
}

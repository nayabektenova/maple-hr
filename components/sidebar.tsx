"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Calendar,
  Users,
  FileText,
  Plane,
  DollarSign,
  MessageSquare,
  ArrowLeftRight,
  FileIcon as FileUser,
  ClipboardList,
  Sparkles,
  Bell,
} from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Announcement", href: "/announcement", icon: Bell },
  { name: "Schedule", href: "/schedule", icon: Calendar },
  { name: "Employees", href: "/employees", icon: Users },
  { name: "Employees Hierarchy", href: "/employee-hierarchy", icon: Users },
  { name: "Reports", href: "/reports", icon: FileText },
  { name: "Leaves", href: "/leaves", icon: Plane },
  { name: "PayStub", href: "/paystub", icon: DollarSign },
  { name: "Finances", href: "/finances", icon: DollarSign },
  { name: "Survey", href: "/survey", icon: MessageSquare },
  { name: "Survey Employee", href: "/survey-employee", icon: MessageSquare },
  { name: "Resume AI", href: "/resume-ai", icon: Sparkles },
  { name: "Requests", href: "/requests", icon: ClipboardList },
  { name: "Employee List", href: "/admin/viewemployee", icon: FileUser },
  { name: "Manage Roles", href: "/admin/manageroles", icon: FileUser },
  { name: "Pay", href: "/employeeview/pay", icon: DollarSign },
  { name: "Submit Expense Claim", href: "/employeeview/submitclaim", icon: DollarSign },
  { name: "Time Off", href: "/employeeview/timeoff", icon: Calendar },
  { name: "My Requests", href: "/requests-employee", icon: ClipboardList },

]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="MapleHR logo" className="w-8 h-8 object-contain" />
          <span className="text-xl font-semibold text-gray-900">MapleHR</span>
        </div>
      </div>


      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const isActive = item.href === "/" ? pathname === "/" : (pathname === item.href || pathname.startsWith(`${item.href}/`))
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative",
                    isActive ? "bg-green-50 text-green-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                  {isActive && (
                    <div className="absolute right-55 top-1/2 -translate-y-1/2 w-1 h-8 bg-green-500 rounded-l" />
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
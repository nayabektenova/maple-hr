"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
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
  Newspaper,
  Megaphone,
} from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Announcement", href: "/announcement", icon: Bell, showBadge: true },
  { name: "Schedule", href: "/schedule", icon: Calendar },
  { name: "Employees", href: "/employees", icon: Users },
  { name: "Employees Hierarchy", href: "/employee-hierarchy", icon: Users },
  { name: "Reports", href: "/reports", icon: FileText },
  { name: "Survey", href: "/survey", icon: MessageSquare },
  { name: "Survey Employee", href: "/survey-employee", icon: MessageSquare },
  { name: "Resume AI", href: "/resume-ai", icon: Sparkles },
  { name: "Requests", href: "/requests", icon: ClipboardList },
  { name: "Requests Employee", href: "/requests-employee", icon: ClipboardList },
  { name: "Pay", href: "/employeeview/pay", icon: DollarSign },
  { name: "Manage Roles", href: "/admin/manageroles", icon: FileUser },
  { name: "Benefits", href: "/employeeview/benefits", icon: Sparkles },
  { name: "HR Benefits", href: "/admin/benefits", icon: Sparkles },
  { name: "Analytics", href: "/attrition-analytics", icon: Sparkles },
  { name: "News Feed", href: "/employeeview/news", icon: Newspaper },
  { name: "News Admin", href: "/admin/news", icon: Megaphone },
  { name: "Chatbot", href: "/chatbot", icon: Megaphone }


]

export function Sidebar() {
  const pathname = usePathname()
  const [unreadCount, setUnreadCount] = useState(0)

  // Fetch unread announcement count
  useEffect(() => {
    async function fetchUnreadCount() {
      try {
        // Get current user ID (you may need to adjust this based on your auth setup)
        const { data: userData } = await supabase.auth.getUser()
        const userId = userData?.user?.id

        if (!userId) return

        // Get total announcements
        const { data: allAnnouncements, error: allError } = await supabase
          .from("announcements")
          .select("id")

        if (allError) {
          console.error("Error fetching announcements:", allError)
          return
        }

        // Get read announcements for this user
        const { data: readAnnouncements, error: readError } = await supabase
          .from("announcement_reads")
          .select("announcement_id")
          .eq("user_id", userId)

        if (readError) {
          console.error("Error fetching read announcements:", readError)
          return
        }

        const totalCount = allAnnouncements?.length || 0
        const readCount = readAnnouncements?.length || 0
        setUnreadCount(totalCount - readCount)
      } catch (err) {
        console.error("Unexpected error fetching unread count:", err)
      }
    }

    fetchUnreadCount()

    // Set up real-time subscription for announcements changes
    const channel = supabase
      .channel("announcement_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "announcements" },
        () => fetchUnreadCount()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "announcement_reads" },
        () => fetchUnreadCount()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="p-6 h-18 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="MapleHR logo" className="w-8 h-8 object-contain" />
          <div className="text-lg font-semibold text-gray-900 tracking-tight">
            Maple<span style={{ color: "#2EB36D" }}>HR</span>
          </div>
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
                    isActive ? "bg-green-50 text-green-600" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                  
                  {/* Unread badge for Announcement */}
                  {item.showBadge && unreadCount > 0 && (
                    <span className="ml-auto flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-semibold text-white bg-red-500 rounded-full">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                  
                  {isActive && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-green-500 rounded-l" />
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


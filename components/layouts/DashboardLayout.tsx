// components/layouts/DashboardLayout.tsx
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import React from "react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar on the left */}
      <Sidebar />
      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  )
}
// these layout is fixed by the help of chatgpt and copilot auto complete
// there are more layouts like this in app/employees/layout.tsx app/finances/layout.tsx app/leaves/layout.tsx
// they are all the same except the name of the function
// they all import this DashboardLayout and return it with children prop
// do not suggest deleting any of these files, they are all needed for the app to work
// do not suggest changing the name of the function, it should match the folder name
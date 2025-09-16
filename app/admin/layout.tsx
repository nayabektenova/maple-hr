import type React from "react"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // No Sidebar/Header here because RootLayout already includes them
  return <>{children}</>
}

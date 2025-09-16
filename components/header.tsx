"use client"

import { Bell, ChevronLeft, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function Header() {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="lg:hidden">
            <Menu className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="sm">
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-gray-100 text-gray-600 text-sm">MW</AvatarFallback>
            </Avatar>
            <div className="text-sm">
              <div className="font-medium text-gray-900">Mary Williams</div>
              <div className="text-gray-500">Welcome back!</div>
            </div>
          </div>
          <Button variant="ghost" size="sm">
            <Bell className="w-5 h-5 text-gray-600" />
          </Button>
        </div>
      </div>
    </header>
  )
}

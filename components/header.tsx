"use client"

import { Bell, ChevronLeft, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"

export function Header() {
  const router = useRouter()
  const [unreadCount, setUnreadCount] = useState(0)

  // Fetch unread announcement count
  useEffect(() => {
    async function fetchUnreadCount() {
      try {
        // Get current user ID
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
      .channel("announcement_changes_header")
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

  // Navigate to announcements page
  const handleNotificationClick = () => {
    router.push("/announcement")
  }

  return (
    <header className="bg-white border-b border-gray-200 h-18 px-6 py-4">
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
          
          {/* Notification Button with Badge */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleNotificationClick}
            className="relative"
          >
            <Bell className="w-5 h-5 text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Button>
        </div>
      </div>
    </header>
  )
}

// "use client"

// import { Bell, ChevronLeft, Menu } from "lucide-react"
// import { Button } from "@/components/ui/button"
// import { Avatar, AvatarFallback } from "@/components/ui/avatar"

// export function Header() {
//   return (
//     <header className="bg-white border-b border-gray-200 h-18 px-6 py-4">
//       <div className="flex items-center justify-between">
//         <div className="flex items-center gap-4">
//           <Button variant="ghost" size="sm" className="lg:hidden">
//             <Menu className="w-5 h-5" />
//           </Button>
//           <Button variant="ghost" size="sm">
//             <ChevronLeft className="w-5 h-5" />
//           </Button>
//         </div>

//         <div className="flex items-center gap-4">
//           <div className="flex items-center gap-3">
//             <Avatar className="w-8 h-8">
//               <AvatarFallback className="bg-gray-100 text-gray-600 text-sm">MW</AvatarFallback>
//             </Avatar>
//             <div className="text-sm">
//               <div className="font-medium text-gray-900">Mary Williams</div>
//               <div className="text-gray-500">Welcome back!</div>
//             </div>
//           </div>
//           <Button variant="ghost" size="sm">
//             <Bell className="w-5 h-5 text-gray-600" />
//           </Button>
//         </div>
//       </div>
//     </header>
//   )
// }

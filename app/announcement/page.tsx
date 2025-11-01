import AnnouncementList from "@/components/announcement"

export default function AnnouncementPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Announcements</h1>
      </div>
      <AnnouncementList />
    </div>
  )
}

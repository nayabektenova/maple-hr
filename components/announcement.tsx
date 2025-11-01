"use client"

import React, { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabaseClient"
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Search,
  Bell,
  Bookmark,
  CheckSquare,
  MessageSquare,
  ThumbsUp,
  CalendarCheck,
  FileText,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { format } from "date-fns"

/**
 * Announcement page component
 *
 * - Designed to be drop-in for announcement.tsx
 * - Mirrors header/filter layout from schedule.tsx (search, department filter, type filter, pinned toggle)
 * - Integrates with Supabase tables (announcements, announcement_responses, announcement_comments, employees)
 *
 * Expected Supabase tables/shape (frontend expects these columns; adapt if your DB differs):
 * - announcements:
 *    id, title, body, type ("meeting"|"training"|"general"|"recognition"|"policy"), created_by,
 *    created_at, start_at (nullable - DateTime for meetings), due_at (nullable - training/policy due date),
 *    attachment_url, join_link, pinned (boolean), department (nullable - target department or null for all)
 * - announcement_responses:
 *    id, announcement_id, user_id, response ("attend"|"unable"|"acknowledged"|"completed"|"seen"|"like"|"view"),
 *    created_at, metadata (json - optional)
 * - announcement_comments:
 *    id, announcement_id, user_id, comment, created_at
 * - employees:
 *    id, first_name, last_name, department
 *
 * NOTE: Adjust DB column names if your schema differs.
 */

// ---------- Helper UI bits (copied/adjusted from schedule.tsx style) ----------
type WorkLocation = "On-site" | "Remote" // reused type just for parity with schedule layout
const CustomSelect = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <div className="relative inline-block">
    <select
      {...props}
      className="px-3 py-2 pr-8 border border-gray-300 rounded-md text-sm appearance-none"
    />
    <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 text-xs">
      ▼
    </span>
  </div>
)

// ---------- Types ----------
type AnnouncementType =
  | "meeting"
  | "training"
  | "general"
  | "recognition"
  | "policy"

type Announcement = {
  id: string
  title: string
  body?: string
  type: AnnouncementType
  created_by?: string
  created_at?: string
  start_at?: string | null
  due_at?: string | null
  attachment_url?: string | null
  join_link?: string | null
  pinned?: boolean
  department?: string | null
}

type Employee = {
  id: string
  firstName: string
  lastName: string
  department?: string | null
}

type ResponseRow = {
  id?: string
  announcement_id: string
  user_id: string
  response: string
  created_at?: string
  metadata?: any
}

type CommentRow = {
  id?: string
  announcement_id: string
  user_id: string
  comment: string
  created_at?: string
}

// ---------- Component ----------
export default function AnnouncementList() {
  // UI State
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<"" | AnnouncementType>("")
  const [departmentFilter, setDepartmentFilter] = useState<string>("")
  const [showPinnedOnly, setShowPinnedOnly] = useState(false)
  const [alphaSort, setAlphaSort] = useState(false)

  // paging / week-like controls kept only for parity with schedule header
  const [pageStart, setPageStart] = useState<Date>(() => new Date())

  // Data state
  const [loading, setLoading] = useState(true)
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [responses, setResponses] = useState<ResponseRow[]>([])
  const [comments, setComments] = useState<CommentRow[]>([])

  // UI interactions
  const [openCommentFor, setOpenCommentFor] = useState<string | null>(null)
  const [commentText, setCommentText] = useState("")
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [expandedAnnouncement, setExpandedAnnouncement] = useState<string | null>(null)

  // Derived lists
  const departments = useMemo(
    () => Array.from(new Set(employees.map((e) => e.department || "").filter(Boolean))),
    [employees]
  )

  useEffect(() => {
    let mounted = true
    async function loadAll() {
      setLoading(true)

      try {
        // find current user id (if authenticated)
        const { data: userData } = await supabase.auth.getUser()
        const uid = userData?.user?.id ?? null
        if (mounted) setCurrentUserId(uid)

        // load employees
        const { data: empData, error: empErr } = await supabase
          .from("employees")
          .select("id, first_name, last_name, department")

        if (empErr) {
          console.error("fetch employees err", empErr)
        } else if (empData && mounted) {
          setEmployees(
            empData.map((r: any) => ({
              id: r.id,
              firstName: r.first_name,
              lastName: r.last_name,
              department: r.department,
            }))
          )
        }

        // load announcements
        const { data: annData, error: annErr } = await supabase
          .from("announcements")
          .select("*")
          .order("pinned", { ascending: false })
          .order("created_at", { ascending: false })

        if (annErr) {
          console.error("fetch announcements err", annErr)
        } else if (annData && mounted) {
          setAnnouncements(
            annData.map((r: any) => ({
              id: r.id,
              title: r.title,
              body: r.body,
              type: r.type,
              created_by: r.created_by,
              created_at: r.created_at,
              start_at: r.start_at,
              due_at: r.due_at,
              attachment_url: r.attachment_url,
              join_link: r.join_link,
              pinned: !!r.pinned,
              department: r.department ?? null,
            }))
          )
        }

        // load responses
        const { data: respData, error: respErr } = await supabase
          .from("announcement_responses")
          .select("*")

        if (respErr) {
          console.error("fetch responses err", respErr)
        } else if (respData && mounted) {
          setResponses(
            respData.map((r: any) => ({
              id: r.id,
              announcement_id: r.announcement_id,
              user_id: r.user_id,
              response: r.response,
              created_at: r.created_at,
              metadata: r.metadata,
            }))
          )
        }

        // load comments
        const { data: comData, error: comErr } = await supabase
          .from("announcement_comments")
          .select("*")
          .order("created_at", { ascending: false })

        if (comErr) {
          console.error("fetch comments err", comErr)
        } else if (comData && mounted) {
          setComments(
            comData.map((r: any) => ({
              id: r.id,
              announcement_id: r.announcement_id,
              user_id: r.user_id,
              comment: r.comment,
              created_at: r.created_at,
            }))
          )
        }
      } catch (err) {
        console.error("Unexpected load error", err)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadAll()
    return () => {
      mounted = false
    }
  }, [])

  // Helper: write a response (attend/unable/acknowledged/completed/seen/like/view)
  async function createResponse(announcementId: string, responseType: string, metadata?: any) {
    if (!currentUserId) {
      alert("No user detected. Make sure you are signed in.")
      return
    }

    try {
      const { data, error } = await supabase.from("announcement_responses").insert([
        {
          announcement_id: announcementId,
          user_id: currentUserId,
          response: responseType,
          metadata: metadata ?? null,
        },
      ]).select().single()

      if (error) {
        console.error("insert response error", error)
      } else if (data) {
        // append locally for immediate UI feedback
        setResponses((prev) => [
          {
            id: data.id,
            announcement_id: data.announcement_id,
            user_id: data.user_id,
            response: data.response,
            created_at: data.created_at,
            metadata: data.metadata,
          },
          ...prev,
        ])

        // For meetings: if user says "attend" optionally upsert schedule (simple example)
        if (responseType === "attend") {
          try {
            // upsert a calendar entry into schedules or user's calendar (optional)
            await supabase.from("schedules").upsert([
              {
                employee_id: currentUserId,
                weekday: format(new Date(), "eee").slice(0, 3), // naive
                kind: "shift",
                start_time: format(new Date(), "hh:mm a"), // placeholder
                end_time: format(new Date(), "hh:mm a"),
                location: "On-site",
              },
            ], { onConflict: "employee_id,weekday" })
          } catch (err) {
            // ignore errors here; schedule integration is optional
            console.warn("schedule upsert (attendance) failed", err)
          }
        }
      }
    } catch (err) {
      console.error("createResponse unexpected", err)
    }
  }

  // Helper: post a comment
  async function postComment(announcementId: string) {
    if (!currentUserId) {
      alert("No user detected. Make sure you are signed in.")
      return
    }
    if (!commentText.trim()) return

    try {
      const { data, error } = await supabase
        .from("announcement_comments")
        .insert([
          {
            announcement_id: announcementId,
            user_id: currentUserId,
            comment: commentText.trim(),
          },
        ])
        .select()
        .single()

      if (error) {
        console.error("insert comment err", error)
      } else if (data) {
        setComments((prev) => [
          {
            id: data.id,
            announcement_id: data.announcement_id,
            user_id: data.user_id,
            comment: data.comment,
            created_at: data.created_at,
          },
          ...prev,
        ])
        setCommentText("")
        setOpenCommentFor(null)
      }
    } catch (err) {
      console.error("postComment unexpected", err)
    }
  }

  // Mark viewed (for read-receipts)
  useEffect(() => {
    // when announcements load and currentUserId exists, mark pinned/latest as viewed (simplified)
    if (!currentUserId || announcements.length === 0) return
    // we'll mark the top 6 visible as 'view'
    const top = announcements.slice(0, 6)
    top.forEach((ann) => void createResponse(ann.id, "view"))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId, announcements.length])

  // Derived: filtered announcements
  const filtered = useMemo(() => {
    let rows = announcements.slice()

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase()
      rows = rows.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          (a.body ?? "").toLowerCase().includes(q)
      )
    }

    if (typeFilter) rows = rows.filter((r) => r.type === typeFilter)
    if (departmentFilter) rows = rows.filter((r) => r.department === departmentFilter)
    if (showPinnedOnly) rows = rows.filter((r) => !!r.pinned)

    if (alphaSort) rows = rows.sort((a, b) => a.title.localeCompare(b.title))

    // pinned announcements first
    rows = rows.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))

    return rows
  }, [announcements, searchTerm, typeFilter, departmentFilter, showPinnedOnly, alphaSort])

  // Helpers for response lookups
  const userResponsesFor = (announcementId: string, resp?: string) =>
    responses.filter((r) => r.announcement_id === announcementId && (!resp || r.response === resp))

  const userHasResponded = (announcementId: string, responseType: string) =>
    responses.some((r) => r.announcement_id === announcementId && r.user_id === currentUserId && r.response === responseType)

  // change page (keeps visual parity with schedule)
  const changePage = (dir: "prev" | "next") => {
    const d = new Date(pageStart)
    d.setDate(pageStart.getDate() + (dir === "next" ? 7 : -7))
    setPageStart(d)
  }

  // Toggle pinned locally + persist
  async function togglePinned(announcementId: string, newPinned: boolean) {
    try {
      const { error } = await supabase
        .from("announcements")
        .update({ pinned: newPinned })
        .eq("id", announcementId)

      if (error) {
        console.error("togglePinned err", error)
      } else {
        setAnnouncements((prev) => prev.map((a) => (a.id === announcementId ? { ...a, pinned: newPinned } : a)))
      }
    } catch (err) {
      console.error("togglePinned unexpected", err)
    }
  }

  // Save "acknowledge" (policy)
  async function acknowledgePolicy(announcementId: string) {
    await createResponse(announcementId, "acknowledged")
  }

  // Mark completed (training)
  async function markCompleted(announcementId: string) {
    await createResponse(announcementId, "completed")
  }

  // Like action
  async function likeAnnouncement(announcementId: string) {
    if (userHasResponded(announcementId, "like")) {
      // simple unlike flow: delete latest like by this user (if you keep that behavior)
      try {
        const ownLike = responses.find((r) => r.announcement_id === announcementId && r.user_id === currentUserId && r.response === "like")
        if (ownLike?.id) {
          await supabase.from("announcement_responses").delete().eq("id", ownLike.id)
          setResponses((prev) => prev.filter((p) => p.id !== ownLike.id))
        }
      } catch (err) {
        console.warn("unlike err", err)
      }
    } else {
      await createResponse(announcementId, "like")
    }
  }

  // Attend / Unable for meetings
  async function rsvpMeeting(announcementId: string, attending: boolean) {
    await createResponse(announcementId, attending ? "attend" : "unable")
  }

  // Expand/collapse announcement details
  function toggleExpand(id: string) {
    setExpandedAnnouncement((prev) => (prev === id ? null : id))
    // register a view when expanded
    void createResponse(id, "view")
  }

  // Loading state
  if (loading) {
    return <div className="bg-white rounded-lg border border-gray-200 p-6">Loading announcements...</div>
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* HEADER */}
      <div className="px-6 py-4 border-b border-gray-200 flex flex-col gap-2">
        <div className="flex items-center gap-4">
          <CustomSelect value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </CustomSelect>

          <CustomSelect value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as any)}>
            <option value="">All Types</option>
            <option value="meeting">Meeting</option>
            <option value="training">Training</option>
            <option value="general">News</option>
            <option value="recognition">Recognition</option>
            <option value="policy">Policy</option>
          </CustomSelect>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search announcements"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Checkbox id="pinned" checked={showPinnedOnly} onCheckedChange={() => setShowPinnedOnly(!showPinnedOnly)} />
            <label htmlFor="pinned" className="text-sm text-gray-600">Pinned only</label>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => changePage("prev")}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium">{format(pageStart, "MMM d, yyyy")}</span>
            <Button variant="ghost" size="sm" onClick={() => changePage("next")}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox id="alphabetic2" checked={alphaSort} onCheckedChange={() => setAlphaSort(!alphaSort)} />
            <label htmlFor="alphabetic2" className="text-sm text-gray-600">Alphabetic order</label>
          </div>

          <div className="ml-auto">
            <Button className="bg-green-600 hover:bg-green-700" onClick={() => alert("Create Announcement UI not implemented in this component. Use your editor to add a create flow.")}>
              Create Announcement
            </Button>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Announcement</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>When / Due</TableHead>
              <TableHead className="w-48">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filtered.map((ann) => {
              const annComments = comments.filter((c) => c.announcement_id === ann.id)
              const likes = userResponsesFor(ann.id, "like").length
              const views = userResponsesFor(ann.id, "view").length
              const seenCount = userResponsesFor(ann.id, "seen").length
              const completedCount = userResponsesFor(ann.id, "completed").length
              return (
                <TableRow key={ann.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => togglePinned(ann.id, !ann.pinned)}>
                        <Bookmark className={`w-4 h-4 ${ann.pinned ? "text-yellow-500" : "text-gray-400"}`} />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="font-medium flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{ann.title}</span>
                        {ann.type === "recognition" && <span className="text-xs px-2 py-1 rounded bg-green-50 text-green-800">Recognition</span>}
                        {ann.type === "policy" && <span className="text-xs px-2 py-1 rounded bg-yellow-50 text-yellow-800">Policy</span>}
                      </div>
                      <div className="text-xs text-gray-600">
                        {ann.body ? ann.body.slice(0, 160) + (ann.body.length > 160 ? "…" : "") : ""}
                      </div>

                      {/* Expand link */}
                      <div className="mt-2">
                        <Button variant="ghost" size="sm" onClick={() => toggleExpand(ann.id)}>
                          {expandedAnnouncement === ann.id ? "Collapse" : "View details"}
                        </Button>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="text-sm capitalize">
                    <div className="flex items-center gap-2">
                      {ann.type === "meeting" && <CalendarCheck className="w-4 h-4" />}
                      {ann.type === "training" && <FileText className="w-4 h-4" />}
                      {ann.type === "general" && <Bell className="w-4 h-4" />}
                      {ann.type === "recognition" && <Users className="w-4 h-4" />}
                      {ann.type === "policy" && <CheckSquare className="w-4 h-4" />}
                      <span>{ann.type}</span>
                    </div>
                  </TableCell>

                  <TableCell className="text-sm">
                    {ann.department ?? "All"}
                  </TableCell>

                  <TableCell className="text-sm">
                    <div>
                      {ann.start_at ? (
                        <div>{format(new Date(ann.start_at), "MMM d, yyyy '•' h:mm a")}</div>
                      ) : ann.due_at ? (
                        <div>Due {format(new Date(ann.due_at), "MMM d, yyyy")}</div>
                      ) : (
                        <div>{ann.created_at ? format(new Date(ann.created_at), "MMM d, yyyy") : ""}</div>
                      )}
                      <div className="text-xs text-gray-500 mt-1">Views: {views} • Likes: {likes} • Completed: {completedCount}</div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      {/* Meeting actions */}
                      {ann.type === "meeting" && (
                        <>
                          <Button size="sm" onClick={() => rsvpMeeting(ann.id, true)}>Attend</Button>
                          <Button variant="ghost" size="sm" onClick={() => rsvpMeeting(ann.id, false)}>Unable</Button>
                          {ann.join_link && (
                            <a href={ann.join_link} target="_blank" rel="noreferrer">
                              <Button size="sm" variant="outline">Join</Button>
                            </a>
                          )}
                        </>
                      )}

                      {/* Training actions */}
                      {ann.type === "training" && (
                        <>
                          {ann.attachment_url ? (
                            <a href={ann.attachment_url} target="_blank" rel="noreferrer">
                              <Button size="sm">Start Training</Button>
                            </a>
                          ) : (
                            <Button size="sm">Open</Button>
                          )}
                          <Button size="sm" onClick={() => markCompleted(ann.id)}>Mark Completed</Button>
                        </>
                      )}

                      {/* Policy acknowledgement */}
                      {ann.type === "policy" && (
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`ack-${ann.id}`}
                            checked={userHasResponded(ann.id, "acknowledged")}
                            onCheckedChange={() => acknowledgePolicy(ann.id)}
                          />
                          <label htmlFor={`ack-${ann.id}`} className="text-sm text-gray-600">I've read & understood</label>
                        </div>
                      )}

                      {/* General / recognition */}
                      {(ann.type === "general" || ann.type === "recognition") && (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => likeAnnouncement(ann.id)}>
                            <ThumbsUp className="w-4 h-4 mr-2" /> {likes}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => { setOpenCommentFor(ann.id); }}>
                            <MessageSquare className="w-4 h-4 mr-2" /> {annComments.length}
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Expanded announcement panel(s) + comment box (rendered below table for simplicity) */}
      <div className="px-6 py-4 border-t border-gray-200">
        {expandedAnnouncement && (() => {
          const ann = announcements.find((a) => a.id === expandedAnnouncement)
          if (!ann) return null
          const annComments = comments.filter((c) => c.announcement_id === ann.id)
          return (
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">{ann.title}</h3>
                    {ann.pinned && <span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800">Pinned</span>}
                  </div>
                  <div className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{ann.body}</div>

                  {/* attachments / links */}
                  <div className="mt-3 flex items-center gap-2">
                    {ann.attachment_url && (
                      <a href={ann.attachment_url} target="_blank" rel="noreferrer" className="text-sm underline">
                        Attachment
                      </a>
                    )}
                    {ann.join_link && (
                      <a href={ann.join_link} target="_blank" rel="noreferrer" className="text-sm underline">Join meeting</a>
                    )}
                    {ann.type === "training" && ann.due_at && (
                      <div className="text-xs text-gray-500">Due by {format(new Date(ann.due_at), "MMM d, yyyy")}</div>
                    )}
                  </div>

                  {/* comment list */}
                  <div className="mt-4">
                    <div className="text-sm font-medium">Comments</div>
                    <div className="mt-2 space-y-2">
                      {annComments.length === 0 && <div className="text-xs text-gray-500">No comments yet</div>}
                      {annComments.map((c) => {
                        const writer = employees.find((e) => e.id === c.user_id)
                        return (
                          <div key={c.id} className="bg-white border border-gray-200 p-2 rounded">
                            <div className="text-xs text-gray-600">
                              <span className="font-medium">{writer ? `${writer.firstName} ${writer.lastName}` : c.user_id}</span>
                              <span className="ml-2 text-gray-400">{c.created_at ? format(new Date(c.created_at), "MMM d, yyyy '•' h:mm a") : ""}</span>
                            </div>
                            <div className="text-sm mt-1">{c.comment}</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* comment composer */}
                  <div className="mt-4">
                    <div className="flex gap-2 items-start">
                      <Textarea
                        value={openCommentFor === ann.id ? commentText : ""}
                        onChange={(e) => { setOpenCommentFor(ann.id); setCommentText(e.target.value) }}
                        placeholder="Write a comment..."
                        className="flex-1"
                        rows={3}
                      />
                      <div className="flex flex-col gap-2">
                        <Button onClick={() => postComment(ann.id)}>Post</Button>
                        <Button variant="ghost" onClick={() => { setOpenCommentFor(null); setCommentText("") }}>Cancel</Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="w-48 text-sm text-gray-600">
                  <div><strong>Created</strong>: {ann.created_at ? format(new Date(ann.created_at), "MMM d, yyyy") : "—"}</div>
                  <div className="mt-2"><strong>Type</strong>: {ann.type}</div>
                  {ann.department && <div className="mt-2"><strong>Target</strong>: {ann.department}</div>}
                  <div className="mt-3">
                    <Button variant="ghost" size="sm" onClick={() => createResponse(ann.id, "seen")}>Acknowledge</Button>
                  </div>
                </div>
              </div>
            </div>
          )
        })()}
      </div>
    </div>
  )
}

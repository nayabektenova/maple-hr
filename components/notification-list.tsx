"use client";

import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Search,
  Bookmark,
  CalendarCheck,
  FileText,
  Bell,
  Users,
  CheckSquare,
  Eye,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

// ---------- small helpers ----------
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
);

type AnnouncementType =
  | "meeting"
  | "training"
  | "general"
  | "recognition"
  | "policy";

type Announcement = {
  id: string;
  title: string;
  body?: string;
  type: AnnouncementType;
  created_by?: string;
  created_at?: string;
  start_at?: string | null;
  due_at?: string | null;
  attachment_url?: string | null;
  join_link?: string | null;
  pinned?: boolean;
  department?: string | null;
  isRead?: boolean;
};

type Employee = {
  id: string;
  firstName: string;
  lastName: string;
  department?: string | null;
};

// ---------- NotificationList main export ----------
export function NotificationList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"" | AnnouncementType>("");
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [alphaSort, setAlphaSort] = useState(false);
  const [pageStart, setPageStart] = useState<Date>(() => new Date());

  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserDept, setCurrentUserDept] = useState<string | null>(null);

  // Get current user and their department
  useEffect(() => {
    async function getCurrentUser() {
      const { data } = await supabase.auth.getUser();
      if (data?.user?.id) {
        setCurrentUserId(data.user.id);
        
        // Fetch user's department from employees table
        const { data: empData } = await supabase
          .from("employees")
          .select("department")
          .eq("id", data.user.id)
          .single();
        
        if (empData) {
          setCurrentUserDept(empData.department);
        }
      }
    }
    getCurrentUser();
  }, []);

  // Initial load - filter by user's department
  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        // Get current user for read status
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;

        if (!userId) {
          if (mounted) setLoading(false);
          return;
        }

        // Get user's department
        const { data: empData } = await supabase
          .from("employees")
          .select("department")
          .eq("id", userId)
          .single();

        const userDept = empData?.department || null;

        // Fetch announcements - only those for "All Departments" OR user's specific department
        const { data: annData, error: annErr } = await supabase
          .from("announcements")
          .select("*")
          .or(`department.is.null,department.eq.${userDept || ''}`)
          .order("pinned", { ascending: false })
          .order("created_at", { ascending: false });

        if (annErr) {
          console.error("announcements err", annErr);
        }
        
        if (annData && mounted) {
          // Get read status for each announcement
          let readAnnouncementIds: string[] = [];
          const { data: readData } = await supabase
            .from("announcement_reads")
            .select("announcement_id")
            .eq("user_id", userId);
          
          if (readData) {
            readAnnouncementIds = readData.map((r: any) => r.announcement_id);
          }

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
              isRead: readAnnouncementIds.includes(r.id),
            }))
          );
        }
      } catch (err) {
        console.error("load announcements unexpected", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();

    // Set up real-time subscription
    const channel = supabase
      .channel("notification_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "announcements" },
        () => load()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "announcement_reads" },
        () => load()
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // Mark announcement as read
  async function markAsRead(announcementId: string) {
    if (!currentUserId) return;

    try {
      const { error } = await supabase
        .from("announcement_reads")
        .upsert(
          { user_id: currentUserId, announcement_id: announcementId },
          { onConflict: "user_id,announcement_id" }
        );

      if (error) {
        console.error("Error marking as read:", error);
        alert("Failed to mark as read");
        return;
      }

      // Update local state
      setAnnouncements((prev) =>
        prev.map((a) =>
          a.id === announcementId ? { ...a, isRead: true } : a
        )
      );
    } catch (err) {
      console.error("Unexpected error marking as read:", err);
    }
  }

  // View announcement
  function viewAnnouncement(announcementId: string) {
    console.log("View announcement:", announcementId);
    alert("View functionality - to be implemented");
  }

  const filtered = useMemo(() => {
    let rows = announcements.slice();
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          (r.body ?? "").toLowerCase().includes(q)
      );
    }
    if (typeFilter) rows = rows.filter((r) => r.type === typeFilter);
    if (showPinnedOnly) rows = rows.filter((r) => !!r.pinned);
    if (alphaSort) rows = rows.sort((a, b) => a.title.localeCompare(b.title));
    else rows = rows.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
    return rows;
  }, [
    announcements,
    searchTerm,
    typeFilter,
    showPinnedOnly,
    alphaSort,
  ]);

  function changePage(dir: "prev" | "next") {
    const d = new Date(pageStart);
    d.setDate(pageStart.getDate() + (dir === "next" ? 7 : -7));
    setPageStart(d);
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        Loading notifications...
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* HEADER */}
      <div className="px-6 py-4 border-b border-gray-200 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Notifications</h1>
          {currentUserDept && (
            <span className="text-sm text-gray-600">
              Showing announcements for: <span className="font-medium">{currentUserDept}</span> & All Departments
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          <CustomSelect
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
          >
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
              placeholder="Search notifications"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="pinned"
              checked={showPinnedOnly}
              onCheckedChange={() => setShowPinnedOnly(!showPinnedOnly)}
            />
            <label htmlFor="pinned" className="text-sm text-gray-600">
              Pinned only
            </label>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => changePage("prev")}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium">
              {format(pageStart, "MMM d, yyyy")}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => changePage("next")}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="alphabetic"
              checked={alphaSort}
              onCheckedChange={() => setAlphaSort(!alphaSort)}
            />
            <label htmlFor="alphabetic" className="text-sm text-gray-600">
              Alphabetic order
            </label>
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
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  No notifications to display
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((ann) => (
                <TableRow 
                  key={ann.id} 
                  className={`hover:bg-gray-50 ${!ann.isRead ? 'bg-blue-50/30' : ''}`}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Bookmark
                        className={`w-4 h-4 ${
                          ann.pinned ? "text-yellow-500" : "text-gray-400"
                        }`}
                      />
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem
                            onClick={() => markAsRead(ann.id)}
                            disabled={ann.isRead}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Mark Read
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => viewAnnouncement(ann.id)}>
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="font-medium flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{ann.title}</span>
                        {!ann.isRead && (
                          <span className="flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                            !
                          </span>
                        )}
                        {ann.type === "recognition" && (
                          <span className="text-xs px-2 py-1 rounded bg-green-50 text-green-800">
                            Recognition
                          </span>
                        )}
                        {ann.type === "policy" && (
                          <span className="text-xs px-2 py-1 rounded bg-yellow-50 text-yellow-800">
                            Policy
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {ann.body
                          ? ann.body.slice(0, 160) +
                            (ann.body.length > 160 ? "…" : "")
                          : ""}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="text-sm capitalize">
                    <div className="flex items-center gap-2">
                      {ann.type === "meeting" && (
                        <CalendarCheck className="w-4 h-4" />
                      )}
                      {ann.type === "training" && (
                        <FileText className="w-4 h-4" />
                      )}
                      {ann.type === "general" && <Bell className="w-4 h-4" />}
                      {ann.type === "recognition" && (
                        <Users className="w-4 h-4" />
                      )}
                      {ann.type === "policy" && (
                        <CheckSquare className="w-4 h-4" />
                      )}
                      <span>{ann.type}</span>
                    </div>
                  </TableCell>

                  <TableCell className="text-sm">
                    {ann.department ?? "All"}
                  </TableCell>

                  <TableCell className="text-sm">
                    <div>
                      {ann.start_at ? (
                        <div>
                          {format(
                            new Date(ann.start_at),
                            "MMM d, yyyy '•' h:mm a"
                          )}
                        </div>
                      ) : ann.due_at ? (
                        <div>
                          Due {format(new Date(ann.due_at), "MMM d, yyyy")}
                        </div>
                      ) : (
                        <div>
                          {ann.created_at
                            ? format(new Date(ann.created_at), "MMM d, yyyy")
                            : ""}
                        </div>
                      )}
                      {ann.pinned && (
                        <div className="text-xs text-yellow-600 mt-1 font-medium">
                          📌 Pinned
                        </div>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      {ann.join_link && (
                        <a href={ann.join_link} target="_blank" rel="noreferrer">
                          <Button size="sm" variant="outline">
                            Join
                          </Button>
                        </a>
                      )}
                      {ann.attachment_url && (
                        <a
                          href={ann.attachment_url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Button size="sm">Attachment</Button>
                        </a>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
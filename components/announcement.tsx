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
  Trash2,
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
import { Textarea } from "@/components/ui/textarea";
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

// ---------- CreateAnnouncementModal (embedded) ----------
function CreateAnnouncementModal({
  open,
  onClose,
  onCreated,
  departments,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (created: Announcement) => void;
  departments: string[];
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState<AnnouncementType>("general");
  const [department, setDepartment] = useState<string>("");
  const [pinned, setPinned] = useState(false);
  const [startAt, setStartAt] = useState<string>("");
  const [dueAt, setDueAt] = useState<string>("");
  const [joinLink, setJoinLink] = useState<string>("");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      setTitle("");
      setBody("");
      setType("general");
      setDepartment("");
      setPinned(false);
      setStartAt("");
      setDueAt("");
      setJoinLink("");
      setAttachmentFile(null);
      setSaving(false);
    }
  }, [open]);

  async function handleFileUpload(file: File) {
    const timestamp = Date.now();
    const key = `attachments/${timestamp}-${file.name.replace(/\s+/g, "_")}`;
    const { data, error } = await supabase.storage
      .from("attachments")
      .upload(key, file, {
        cacheControl: "3600",
        upsert: false,
      });
    if (error) {
      console.error("file upload error", error);
      throw error;
    }
    const { data: urlData } = supabase.storage
      .from("attachments")
      .getPublicUrl(data.path);
    return urlData.publicUrl;
  }

  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!title.trim()) {
      alert("Title is required");
      return;
    }
    setSaving(true);
    try {
      let attachment_url: string | null = null;
      if (attachmentFile) {
        try {
          attachment_url = await handleFileUpload(attachmentFile);
        } catch (err) {
          console.warn("attachment upload failed, continuing without it", err);
          attachment_url = null;
        }
      }

      const formatDateTime = (dateTimeStr: string) => {
        if (!dateTimeStr) return null;
        return new Date(dateTimeStr).toISOString();
      };

      const formatDate = (dateStr: string) => {
        if (!dateStr) return null;
        return new Date(dateStr + 'T00:00:00').toISOString();
      };

      const payload: any = {
        title: title.trim(),
        body: body.trim() || null,
        type,
        pinned,
        department: department || null,
        attachment_url,
        join_link: joinLink.trim() || null,
        start_at: startAt ? formatDateTime(startAt) : null,
        due_at: dueAt ? formatDate(dueAt) : null,
      };

      console.log("Inserting payload:", payload);

      const { data, error } = await supabase
        .from("announcements")
        .insert([payload])
        .select()
        .single();

      if (error) {
        console.error("Insert announcement error:", error);
        alert(`Failed to create announcement: ${error.message}\nDetails: ${JSON.stringify(error.details || {})}`);
        return;
      }

      if (data) {
        const created: Announcement = {
          id: data.id,
          title: data.title,
          body: data.body,
          type: data.type,
          created_by: data.created_by,
          created_at: data.created_at,
          start_at: data.start_at,
          due_at: data.due_at,
          attachment_url: data.attachment_url,
          join_link: data.join_link,
          pinned: !!data.pinned,
          department: data.department ?? null,
          isRead: false,
        };
        onCreated(created);
        onClose();
      }
    } catch (err: any) {
      console.error("Unexpected create error:", err);
      alert(`Unexpected error creating announcement: ${err.message || err}`);
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={() => onClose()} />
      <form
        onSubmit={handleSubmit}
        className="relative z-10 max-w-3xl w-full bg-white rounded-md shadow-lg p-6 space-y-4"
      >
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-semibold">Create Announcement</h2>
          <div className="text-sm text-gray-500">
            {saving ? "Saving..." : ""}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <CustomSelect
            value={type}
            onChange={(e) => setType(e.target.value as AnnouncementType)}
          >
            <option value="meeting">Meeting</option>
            <option value="training">Training</option>
            <option value="general">General / News</option>
            <option value="recognition">Recognition</option>
            <option value="policy">Policy</option>
          </CustomSelect>
        </div>

        <div>
          <Textarea
            placeholder="Body / description"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={6}
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <CustomSelect
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </CustomSelect>

          <Input
            placeholder="Join link (Zoom/Teams) (optional)"
            value={joinLink}
            onChange={(e) => setJoinLink(e.target.value)}
          />

          <div className="flex items-center gap-2">
            <Checkbox
              id="pinned-create"
              checked={pinned}
              onCheckedChange={() => setPinned(!pinned)}
            />
            <label htmlFor="pinned-create" className="text-sm text-gray-600">
              Pinned
            </label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col">
            <label className="text-sm text-gray-700 mb-1">
              Start Date & Time (for meetings)
            </label>
            <Input
              type="datetime-local"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
              placeholder="Select start date/time"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm text-gray-700 mb-1">
              Due Date (for training/policy)
            </label>
            <Input
              type="date"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
              placeholder="Select due date"
            />
          </div>
        </div>

        <div className="border border-green-400 rounded-lg p-3 bg-green-50/30 mt-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Attachment (optional)
          </label>
          <input
            type="file"
            onChange={(e) => setAttachmentFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-gray-700
               file:mr-4 file:py-2 file:px-4
               file:rounded-md file:border-0
               file:text-sm file:font-semibold
               file:bg-green-600 file:text-white
               hover:file:bg-green-700
               cursor-pointer"
          />
          {attachmentFile && (
            <p className="mt-1 text-xs text-gray-600">
              Selected file:{" "}
              <span className="font-medium">{attachmentFile.name}</span>
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" type="button" onClick={() => onClose()}>
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-green-600 hover:bg-green-700"
            disabled={saving}
          >
            Create
          </Button>
        </div>
      </form>
    </div>
  );
}

// ---------- AnnouncementList main export ----------
export function AnnouncementList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"" | AnnouncementType>("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("");
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [alphaSort, setAlphaSort] = useState(false);
  const [pageStart, setPageStart] = useState<Date>(() => new Date());

  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const departments = useMemo(
    () =>
      Array.from(
        new Set(employees.map((e) => e.department ?? "").filter(Boolean))
      ),
    [employees]
  );

  // Get current user
  useEffect(() => {
    async function getCurrentUser() {
      const { data } = await supabase.auth.getUser();
      if (data?.user?.id) {
        setCurrentUserId(data.user.id);
      }
    }
    getCurrentUser();
  }, []);

  // Initial load
  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        // Get current user for read status
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;

        // Employees
        const { data: empData, error: empErr } = await supabase
          .from("employees")
          .select("id, first_name, last_name, department");
        if (empErr) console.error("employees err", empErr);
        if (empData && mounted) {
          setEmployees(
            empData.map((r: any) => ({
              id: r.id,
              firstName: r.first_name,
              lastName: r.last_name,
              department: r.department,
            }))
          );
        }

        // Announcements
        const { data: annData, error: annErr } = await supabase
          .from("announcements")
          .select("*")
          .order("pinned", { ascending: false })
          .order("created_at", { ascending: false });

        if (annErr) console.error("announcements err", annErr);
        
        if (annData && mounted) {
          // Get read status for each announcement
          let readAnnouncementIds: string[] = [];
          if (userId) {
            const { data: readData } = await supabase
              .from("announcement_reads")
              .select("announcement_id")
              .eq("user_id", userId);
            
            if (readData) {
              readAnnouncementIds = readData.map((r: any) => r.announcement_id);
            }
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
    return () => {
      mounted = false;
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

  // Delete announcement
  async function deleteAnnouncement(announcementId: string) {
    if (!confirm("Are you sure you want to delete this announcement?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("announcements")
        .delete()
        .eq("id", announcementId);

      if (error) {
        console.error("Error deleting announcement:", error);
        alert("Failed to delete announcement");
        return;
      }

      // Update local state
      setAnnouncements((prev) => prev.filter((a) => a.id !== announcementId));
    } catch (err) {
      console.error("Unexpected error deleting announcement:", err);
    }
  }

  // View announcement (placeholder for now)
  function viewAnnouncement(announcementId: string) {
    // TODO: Navigate to detail page or open modal
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
    if (departmentFilter)
      rows = rows.filter((r) => r.department === departmentFilter);
    if (showPinnedOnly) rows = rows.filter((r) => !!r.pinned);
    if (alphaSort) rows = rows.sort((a, b) => a.title.localeCompare(b.title));
    rows = rows.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
    return rows;
  }, [
    announcements,
    searchTerm,
    typeFilter,
    departmentFilter,
    showPinnedOnly,
    alphaSort,
  ]);

  function changePage(dir: "prev" | "next") {
    const d = new Date(pageStart);
    d.setDate(pageStart.getDate() + (dir === "next" ? 7 : -7));
    setPageStart(d);
  }

  function handleCreated(created: Announcement) {
    setAnnouncements((prev) => [created, ...prev]);
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        Loading announcements...
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* HEADER */}
      <div className="px-6 py-4 border-b border-gray-200 flex flex-col gap-2">
        <div className="flex items-center gap-4">
          <CustomSelect
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </CustomSelect>

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
              placeholder="Search announcements"
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
              id="alphabetic2"
              checked={alphaSort}
              onCheckedChange={() => setAlphaSort(!alphaSort)}
            />
            <label htmlFor="alphabetic2" className="text-sm text-gray-600">
              Alphabetic order
            </label>
          </div>

          <div className="ml-auto">
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => setModalOpen(true)}
            >
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
            {filtered.map((ann) => (
              <TableRow 
                key={ann.id} 
                className={`hover:bg-gray-50 ${!ann.isRead ? 'bg-blue-50/30' : ''}`}
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        const newPinned = !ann.pinned;
                        setAnnouncements((prev) =>
                          prev.map((a) =>
                            a.id === ann.id ? { ...a, pinned: newPinned } : a
                          )
                        );
                        await supabase
                          .from("announcements")
                          .update({ pinned: newPinned })
                          .eq("id", ann.id);
                      }}
                    >
                      <Bookmark
                        className={`w-4 h-4 ${
                          ann.pinned ? "text-yellow-500" : "text-gray-400"
                        }`}
                      />
                    </Button>
                    
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
                        <DropdownMenuItem
                          onClick={() => deleteAnnouncement(ann.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
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
                    <div className="text-xs text-gray-600">
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
                    <div className="text-xs text-gray-500 mt-1">
                      Pinned: {ann.pinned ? "Yes" : "No"}
                    </div>
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
            ))}
          </TableBody>
        </Table>
      </div>

      {/* CREATE MODAL */}
      <CreateAnnouncementModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleCreated}
        departments={departments}
      />
    </div>
  );
}

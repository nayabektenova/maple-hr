"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AlertCircle } from "lucide-react";

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

export default function AdminNewsManager() {
  const [branches, setBranches] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [branchId, setBranchId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isCritical, setIsCritical] = useState(false); // ← NEW

  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadBranches();
    loadPosts();
  }, []);

  async function loadBranches() {
    const { data } = await supabase.from("branches").select("*");
    setBranches(data ?? []);
  }

  async function loadPosts() {
    const { data } = await supabase
      .from("news_posts")
      .select(`
        *,
        branches (name),
        requires_acknowledgment,
        acknowledgments_count
      `)
      .order("created_at", { ascending: false });
    setPosts(data ?? []);
  }

  async function uploadImage() {
    if (!file) return null;
    const fileName = `${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("news").upload(fileName, file);
    if (error) {
      setNote("Image upload failed: " + error.message);
      return null;
    }
    const { data } = supabase.storage.from("news").getPublicUrl(fileName);
    return data.publicUrl;
  }

  async function createPost() {
    if (!title.trim() || !body.trim()) {
      setNote("Please fill in title and message");
      return;
    }

    setLoading(true);
    setNote("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setNote("You must be logged in");
        return;
      }

      const imageUrl = await uploadImage();

      const { error } = await supabase.from("news_posts").insert({
        title: title.trim(),
        body: body.trim(),
        image_url: imageUrl,
        branch_id: branchId === "all" ? null : branchId || null,
        created_by: user.id,
        requires_acknowledgment: isCritical, // ← THIS IS THE LINK
      });

      if (error) throw error;

      setNote("Post created successfully!");
      resetForm();
      loadPosts();
    } catch (err: any) {
      setNote("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setTitle("");
    setBody("");
    setFile(null);
    setBranchId(null);
    setIsCritical(false);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (input) input.value = "";
  }

  async function deletePost(id: string) {
    if (!confirm("Delete this post permanently?")) return;

    const { error } = await supabase.from("news_posts").delete().eq("id", id);
    if (error) {
      setNote("Delete failed: " + error.message);
    } else {
      setNote("Post deleted");
      loadPosts();
    }
  }

  function getBranchName(post: any) {
    if (!post.branch_id) return "All Branches";
    return post.branches?.name || "Unknown Branch";
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-8">
      {/* Create Post Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Create News Post
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {note && (
            <div className={`p-4 rounded-lg text-sm border ${
              note.includes("Error") || note.includes("failed")
                ? "bg-red-50 text-red-700 border-red-200"
                : "bg-green-50 text-green-700 border-green-200"
            }`}>
              {note}
            </div>
          )}

          <div className="grid gap-6">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                placeholder="e.g. New Safety Policy – Mandatory Reading"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                placeholder="Write your announcement..."
                rows={5}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label>Image (Optional)</Label>
              <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} disabled={loading} />
            </div>

            <div className="space-y-2">
              <Label>Target Audience</Label>
              <select
                className="w-full border rounded-lg px-3 py-2 bg-white"
                value={branchId || ""}
                onChange={(e) => setBranchId(e.target.value || null)}
                disabled={loading}
              >
                <option value="">All branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            {/* ←←← CRITICAL TOGGLE */}
            <div className="flex items-center space-x-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <Switch
                id="critical"
                checked={isCritical}
                onCheckedChange={setIsCritical}
                disabled={loading}
              />
              <Label htmlFor="critical" className="cursor-pointer flex-1">
                <div className="font-semibold text-orange-800">Mark as Critical</div>
                <div className="text-sm text-orange-700">
                  Employees must click “Acknowledge” to confirm they’ve read it. Shows orange highlight + counter.
                </div>
              </Label>
            </div>

            <Button
              onClick={createPost}
              className="w-full"
              size="lg"
              disabled={loading || !title.trim() || !body.trim()}
            >
              {loading ? "Creating..." : "Publish Post"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Posts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Manage Posts ({posts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {posts.length === 0 ? (
            <p className="text-center text-gray-500 py-12">No posts yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Critical?</TableHead>
                  <TableHead>Acks</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Image</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((post) => (
                  <TableRow key={post.id} className={post.requires_acknowledgment ? "bg-orange-50" : ""}>
                    <TableCell className="font-medium">
                      {post.title}
                      {post.requires_acknowledgment && (
                        <span className="ml-2 text-xs bg-orange-600 text-white px-2 py-1 rounded">CRITICAL</span>
                      )}
                    </TableCell>
                    <TableCell>{getBranchName(post)}</TableCell>
                    <TableCell>
                      {post.requires_acknowledgment ? (
                        <span className="text-orange-600 font-medium">Yes</span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      {post.acknowledgments_count || 0}
                    </TableCell>
                    <TableCell>
                      {new Date(post.created_at).toLocaleDateString("en-CA", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell>{post.image_url ? "Yes" : "—"}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="destructive" onClick={() => deletePost(post.id)}>
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
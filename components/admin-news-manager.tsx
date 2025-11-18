"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
        branches (
          name
        )
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
      setNote("Please fill in both title and message");
      return;
    }

    setLoading(true);
    setNote("");

    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setNote("You must be logged in to create posts");
        return;
      }

      const imageUrl = await uploadImage();

      const { error } = await supabase.from("news_posts").insert([
        {
          title: title.trim(),
          body: body.trim(),
          image_url: imageUrl,
          branch_id: branchId === "all" ? null : branchId,
          created_by: user.id
        },
      ]);

      if (error) {
        setNote("Post failed: " + error.message);
        return;
      }

      setNote("Post created successfully!");
      setTitle("");
      setBody("");
      setFile(null);
      setBranchId(null);
      
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = "";
      
      loadPosts();
    } catch (error: any) {
      setNote("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function deletePost(id: string) {
    const ok = confirm("Are you sure you want to delete this post?");
    if (!ok) return;

    const { error } = await supabase.from("news_posts").delete().eq("id", id);
    
    if (error) {
      setNote("Delete failed: " + error.message);
      return;
    }

    setNote("Post deleted successfully!");
    loadPosts();
  }

  function getBranchName(post: any) {
    if (!post.branch_id) return "All Branches";
    return post.branches?.name || "Unknown Branch";
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create News Post</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {note && (
            <div className={`p-3 rounded text-sm ${
              note.includes("failed") || note.includes("Error") 
                ? "bg-red-50 text-red-700 border border-red-200" 
                : "bg-green-50 text-green-700 border border-green-200"
            }`}>
              {note}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input
              placeholder="Enter post title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Message</label>
            <Textarea
              placeholder="Enter your message…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Image (Optional)</label>
            <Input 
              type="file" 
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Branch</label>
            <select
              className="w-full border rounded p-2 bg-white"
              value={branchId || ""}
              onChange={(e) => setBranchId(e.target.value || null)}
              disabled={loading}
            >
              <option value="">Select branch</option>
              <option value="all">All branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <Button 
            onClick={createPost} 
            className="w-full" 
            disabled={loading || !title.trim() || !body.trim()}
          >
            {loading ? "Creating Post..." : "Post News"}
          </Button>
        </CardContent>
      </Card>

      {/* Posts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Manage Posts ({posts.length})</CardTitle>
        </CardHeader>

        <CardContent>
          {posts.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No posts yet. Create your first news post above!
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Image</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {posts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell className="font-medium">{post.title}</TableCell>
                    <TableCell>{getBranchName(post)}</TableCell>
                    <TableCell>
                      {new Date(post.created_at).toLocaleDateString('en-CA', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </TableCell>
                    <TableCell>
                      {post.image_url ? (
                        <span className="text-green-600 text-sm">Yes</span>
                      ) : (
                        <span className="text-gray-400 text-sm">No</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deletePost(post.id)}
                        disabled={loading}
                      >
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
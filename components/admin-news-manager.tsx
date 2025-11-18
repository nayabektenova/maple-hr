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
      .select("*")
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
    const imageUrl = await uploadImage();

    const { error } = await supabase.from("news_posts").insert([
      {
        title,
        body,
        image_url: imageUrl,
        branch_id: branchId === "all" ? null : branchId,
      },
    ]);

    if (error) {
      setNote("Post failed: " + error.message);
      return;
    }

    setNote("Post created!");
    setTitle("");
    setBody("");
    setFile(null);
    loadPosts();
  }

  async function deletePost(id: string) {
    const ok = confirm("Delete this post?");
    if (!ok) return;

    await supabase.from("news_posts").delete().eq("id", id);
    loadPosts();
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Create News Post</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {note && <p className="text-blue-600 text-sm">{note}</p>}

          <Input
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <Textarea
            placeholder="Message…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />

          <Input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />

          <select
            className="border rounded p-2"
            onChange={(e) => setBranchId(e.target.value)}
          >
            <option value="">Select branch</option>
            <option value="all">All branches</option>

            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          <Button onClick={createPost} className="w-full">
            Post News
          </Button>
        </CardContent>
      </Card>

      {/* table */}
      <Card>
        <CardHeader>
          <CardTitle>Manage Posts</CardTitle>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Date</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {posts.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.title}</TableCell>
                  <TableCell>
                    {p.branch_id
                      ? branches.find((b) => b.id === p.branch_id)?.name
                      : "All"}
                  </TableCell>
                  <TableCell>
                    {new Date(p.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deletePost(p.id)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

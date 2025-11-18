"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function EmployeeNewsFeed() {
  const [posts, setPosts] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [branchId, setBranchId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "mine">("mine");

  useEffect(() => {
    loadBranches();
    loadPosts();
  }, []);

  async function loadBranches() {
    const { data } = await supabase.from("branches").select("*");
    setBranches(data ?? []);

    // get user branch metadata (adjust if needed)
    const { data: session } = await supabase.auth.getUser();
    const userBranchId = session?.user?.user_metadata?.branch_id || null;
    setBranchId(userBranchId);
  }

  async function loadPosts() {
    const { data } = await supabase
      .from("news_posts")
      .select("*")
      .order("created_at", { ascending: false });

    setPosts(data ?? []);
  }

  const filtered = posts.filter((p) => {
    if (filter === "all") return true;
    if (filter === "mine") return p.branch_id === branchId || p.branch_id === null;
    return true;
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-xl font-bold">Company News</h1>

      <div className="flex gap-2">
        <Button
          variant={filter === "mine" ? "default" : "outline"}
          onClick={() => setFilter("mine")}
        >
          My Branch
        </Button>

        <Button
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
        >
          All Branches
        </Button>
      </div>

      {filtered.map((post) => (
        <Card key={post.id}>
          <CardHeader>
            <CardTitle>{post.title}</CardTitle>
            <p className="text-sm text-gray-500">
              {post.branch_id
                ? branches.find((b) => b.id === post.branch_id)?.name
                : "All branches"}{" "}
              • {new Date(post.created_at).toLocaleDateString()}
            </p>
          </CardHeader>

          <CardContent>
            {post.image_url && (
              <img
                src={post.image_url}
                className="rounded mb-3 w-full object-cover"
                alt="News"
              />
            )}
            <p>{post.body}</p>
          </CardContent>
        </Card>
      ))}

      {filtered.length === 0 && (
        <p className="text-center text-gray-500 mt-6">No posts available.</p>
      )}
    </div>
  );
}

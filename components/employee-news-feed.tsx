"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { toast } from "sonner"; // optional, remove if you don't use sonner

export default function EmployeeNewsPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [userFavorites, setUserFavorites] = useState<Set<string>>(new Set());
  const [isToggling, setIsToggling] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"all" | "favorites">("all");

  const currentUser = supabase.auth.getUser();

  useEffect(() => {
    loadPosts();
    loadUserFavorites();
  }, [selectedBranch]);

  // Load all posts
  async function loadPosts() {
    setLoading(true);

    let query = supabase
      .from("news_posts")
      .select(`
        *,
        branches (name),
        favorites_count
      `)
      .order("created_at", { ascending: false });

    if (selectedBranch !== "all") {
      query = query.or(`branch_id.eq.${selectedBranch},branch_id.is.null`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error loading posts:", error);
      toast.error("Failed to load news");
    } else {
      setPosts(data || []);
    }
    setLoading(false);
  }

  // Load which posts current user has favorited
  async function loadUserFavorites() {
    const { data: userData } = await currentUser;
    if (!userData?.user) return;

    const { data } = await supabase
      .from("post_favorites")
      .select("post_id")
      .eq("user_id", userData.user.id);

    const favoriteIds = new Set(data?.map((f) => f.post_id) || []);
    setUserFavorites(favoriteIds);
  }

  // Toggle favorite
  async function toggleFavorite(postId: string, currentCount: number) {
    setIsToggling(postId);

    const { data: userData } = await currentUser;
    if (!userData?.user) {
      toast.error("You must be logged in to favorite posts");
      setIsToggling(null);
      return;
    }

    const isFavorited = userFavorites.has(postId);

    if (isFavorited) {
      const { error } = await supabase
        .from("post_favorites")
        .delete()
        .eq("user_id", userData.user.id)
        .eq("post_id", postId);

      if (!error) {
        setUserFavorites((prev) => {
          const next = new Set(prev);
          next.delete(postId);
          return next;
        });
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, favorites_count: currentCount - 1 } : p
          )
        );
        toast.success("Removed from favorites");
      }
    } else {
      const { error } = await supabase
        .from("post_favorites")
        .insert({ user_id: userData.user.id, post_id: postId });

      if (!error) {
        setUserFavorites((prev) => new Set(prev).add(postId));
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, favorites_count: currentCount + 1 } : p
          )
        );
        toast.success("Added to favorites!");
      }
    }

    setIsToggling(null);
  }

  function getBranchName(post: any) {
    if (!post.branch_id) return "All Branches";
    return post.branches?.name || "Unknown Branch";
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("en-CA", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // Determine which posts to show
  const displayedPosts =
    viewMode === "favorites"
      ? posts.filter((p) => userFavorites.has(p.id))
      : posts;

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Company News & Announcements</span>
            <Button variant="outline" size="sm" onClick={loadPosts} disabled={loading}>
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>

        <CardContent>
          {/* Branch Filter */}
          <div className="mb-6">
            <label className="text-sm font-medium mb-2 block">Filter by Branch:</label>
            <select
              className="border rounded-lg px-3 py-2 bg-white text-sm"
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              disabled={loading}
            >
              <option value="all">All News</option>
              <option value="null">Global Announcements</option>
              {/* Add more branches dynamically if you fetch them */}
            </select>
          </div>

          {/* All / Favorites Toggle */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode("all")}
                className={`px-5 py-2 rounded-md text-sm font-medium transition-all ${
                  viewMode === "all"
                    ? "bg-white shadow-sm text-gray-900"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                All News
              </button>
              <button
                onClick={() => setViewMode("favorites")}
                className={`px-5 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                  viewMode === "favorites"
                    ? "bg-white shadow-sm text-gray-900"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Heart className={`w-4 h-4 ${viewMode === "favorites" ? "fill-red-500 text-red-500" : ""}`} />
                My Favorites
                {userFavorites.size > 0 && viewMode === "all" && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                    {userFavorites.size}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Loading / Empty / Posts */}
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading news...</div>
          ) : displayedPosts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {viewMode === "favorites"
                ? "You haven't favorited any posts yet."
                : "No news announcements yet."}
            </div>
          ) : (
            <div className="space-y-6">
              {displayedPosts.map((post) => {
                const isFavorited = userFavorites.has(post.id);
                const isAnimating = isToggling === post.id;

                return (
                  <Card key={post.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{post.title}</CardTitle>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span>{formatDate(post.created_at)}</span>
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                              {getBranchName(post)}
                            </span>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleFavorite(post.id, post.favorites_count || 0)}
                          disabled={isAnimating}
                          className={`transition-all ${isFavorited ? "text-red-500" : "text-gray-400"} hover:text-red-500`}
                        >
                          <Heart
                            className={`w-5 h-5 transition-all ${
                              isFavorited ? "fill-current scale-110" : ""
                            } ${isAnimating ? "animate-ping" : ""}`}
                          />
                          <span className="ml-1 text-sm font-medium">
                            {post.favorites_count || 0}
                          </span>
                        </Button>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="text-gray-700 whitespace-pre-wrap">{post.body}</div>

                      {post.image_url && (
                        <div className="mt-4">
                          <img
                            src={post.image_url}
                            alt={post.title}
                            className="max-w-full h-auto rounded-lg max-h-96 object-cover"
                            onError={(e) => (e.currentTarget.style.display = "none")}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
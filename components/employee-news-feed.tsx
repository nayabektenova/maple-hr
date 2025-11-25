"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, Search, Eye, EyeOff, Check } from "lucide-react";
import { toast } from "sonner";

export default function EmployeeNewsPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [userFavorites, setUserFavorites] = useState<Set<string>>(new Set());
  const [userAcknowledgments, setUserAcknowledgments] = useState<Set<string>>(new Set());
  const [isToggling, setIsToggling] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"all" | "favorites">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const currentUser = supabase.auth.getUser();

  useEffect(() => {
    loadPosts();
    loadUserData();
  }, [selectedBranch]);

  async function loadPosts() {
    setLoading(true);
    let query = supabase
      .from("news_posts")
      .select(`*, branches (name), favorites_count, acknowledgments_count, requires_acknowledgment`)
      .order("created_at", { ascending: false });

    if (selectedBranch !== "all") {
      query = query.or(`branch_id.eq.${selectedBranch},branch_id.is.null`);
    }

    const { data, error } = await query;
    if (error) {
      toast.error("Failed to load posts");
    } else {
      setPosts(data || []);
    }
    setLoading(false);
  }

  async function loadUserData() {
    const { data: userData } = await currentUser;
    if (!userData?.user) return;

    // Load favorites
    const { data: favs } = await supabase
      .from("post_favorites")
      .select("post_id")
      .eq("user_id", userData.user.id);
    setUserFavorites(new Set(favs?.map(f => f.post_id) || []));

    // Load acknowledgments
    const { data: acks } = await supabase
      .from("post_acknowledgments")
      .select("post_id")
      .eq("user_id", userData.user.id);
    setUserAcknowledgments(new Set(acks?.map(a => a.post_id) || []));
  }

  async function toggleFavorite(postId: string, count: number) {
    setIsToggling(postId);
    const { data: user } = await currentUser;
    if (!user?.user) { toast.error("Please log in"); setIsToggling(null); return; }

    const isFav = userFavorites.has(postId);
    if (isFav) {
      await supabase.from("post_favorites").delete().eq("user_id", user.user.id).eq("post_id", postId);
      setUserFavorites(prev => { const n = new Set(prev); n.delete(postId); return n; });
      setPosts(p => p.map(x => x.id === postId ? { ...x, favorites_count: count - 1 } : x));
      toast.success("Removed from favorites");
    } else {
      await supabase.from("post_favorites").insert({ user_id: user.user.id, post_id: postId });
      setUserFavorites(prev => new Set(prev).add(postId));
      setPosts(p => p.map(x => x.id === postId ? { ...x, favorites_count: count + 1 } : x));
      toast.success("Added to favorites");
    }
    setIsToggling(null);
  }

  async function acknowledgePost(postId: string, currentCount: number) {
    const { data: user } = await currentUser;
    if (!user?.user) { toast.error("Please log in"); return; }

    if (userAcknowledgments.has(postId)) {
      toast.info("You already acknowledged this");
      return;
    }

    const { error } = await supabase
      .from("post_acknowledgments")
      .insert({ user_id: user.user.id, post_id: postId });

    if (!error) {
      setUserAcknowledgments(prev => new Set(prev).add(postId));
      setPosts(p => p.map(x => x.id === postId ? { ...x, acknowledgments_count: currentCount + 1 } : x));
      toast.success("Acknowledged");
    }
  }

  function getBranchName(post: any) {
    if (!post.branch_id) return "All Branches";
    return post.branches?.name || "Unknown Branch";
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("en-CA", {
      year: "numeric", month: "long", day: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  }

  const displayedPosts = useMemo(() => {
    let filtered = posts;
    if (viewMode === "favorites") filtered = filtered.filter(p => userFavorites.has(p.id));
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.title?.toLowerCase().includes(q) || p.body?.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [posts, viewMode, userFavorites, searchQuery]);

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
          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search announcements..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Branch Filter */}
          <div className="mb-6">
            <label className="text-sm font-medium mb-2 block">Filter by Branch:</label>
            <select className="border rounded-lg px-3 py-2 w-full max-w-xs" value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)}>
              <option value="all">All News</option>
              <option value="null">Global Announcements</option>
            </select>
          </div>

          {/* Tabs */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button onClick={() => setViewMode("all")} className={`px-5 py-2 rounded-md text-sm font-medium ${viewMode === "all" ? "bg-white shadow-sm" : ""}`}>
                All News
              </button>
              <button onClick={() => setViewMode("favorites")} className={`px-5 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${viewMode === "favorites" ? "bg-white shadow-sm" : ""}`}>
                <Heart className={`w-4 h-4 ${viewMode === "favorites" ? "fill-red-500 text-red-500" : ""}`} />
                My Favorites
                {userFavorites.size > 0 && viewMode === "all" && <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">{userFavorites.size}</span>}
              </button>
            </div>
            <div className="text-sm text-gray-500">{displayedPosts.length} posts</div>
          </div>

          {/* Posts */}
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading...</div>
          ) : displayedPosts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {searchQuery ? `No results for "${searchQuery}"` : viewMode === "favorites" ? "No favorites yet" : "No announcements"}
            </div>
          ) : (
            <div className="space-y-6">
              {displayedPosts.map(post => {
                const isFav = userFavorites.has(post.id);
                const isAck = userAcknowledgments.has(post.id);
                const needsAck = post.requires_acknowledgment;

                return (
                  <Card key={post.id} className={`hover:shadow-md transition-shadow ${needsAck && !isAck ? "ring-2 ring-orange-400 ring-offset-2" : ""}`}>
                    <CardHeader>
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <CardTitle className="text-lg flex items-center gap-3">
                            {post.title}
                            {needsAck && !isAck && <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded">Requires Acknowledgment</span>}
                          </CardTitle>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span>{formatDate(post.created_at)}</span>
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                              {getBranchName(post)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {/* Favorite */}
                          <Button
                            variant="ghost" size="sm"
                            onClick={() => toggleFavorite(post.id, post.favorites_count || 0)}
                            disabled={isToggling === post.id}
                            className={isFav ? "text-red-500" : "text-gray-400"}
                          >
                            <Heart className={`w-5 h-5 ${isFav ? "fill-current" : ""}`} />
                            <span className="ml-1 text-sm">{post.favorites_count || 0}</span>
                          </Button>

                          {/* Acknowledgment */}
                          {needsAck && (
                            <Button
                              variant={isAck ? "default" : "outline"}
                              size="sm"
                              onClick={() => acknowledgePost(post.id, post.acknowledgments_count || 0)}
                              disabled={isAck}
                              className={isAck ? "bg-green-600 hover:bg-green-700 text-white" : ""}
                            >
                              {isAck ? (
                                <>
                                  <Check className="w-4 h-4 mr-1" />
                                  Acknowledged
                                </>
                              ) : (
                                <>
                                  <Eye className="w-4 h-4 mr-1" />
                                  Acknowledge
                                </>
                              )}
                              {!isAck && <span className="ml-1">({post.acknowledgments_count || 0})</span>}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="text-gray-700 whitespace-pre-wrap">{post.body}</div>
                      {post.image_url && (
                        <img src={post.image_url} alt={post.title} className="max-w-full h-auto rounded-lg max-h-96 object-cover" onError={e => e.currentTarget.style.display = "none"} />
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
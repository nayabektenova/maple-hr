"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { toast } from "sonner"; // optional: for nice feedback

export default function EmployeeNewsPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [userFavorites, setUserFavorites] = useState<Set<string>>(new Set());
  const [isToggling, setIsToggling] = useState<string | null>(null);

  // Get current user
  const user = supabase.auth.getUser();

  useEffect(() => {
    loadPosts();
    loadUserFavorites();
  }, [selectedBranch]);

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

  async function loadUserFavorites() {
    const { data: userData } = await user;
    if (!userData?.user) return;

    const { data } = await supabase
      .from("post_favorites")
      .select("post_id")
      .eq("user_id", userData.user.id);

    const favoritePostIds = new Set(data?.map(f => f.post_id) || []);
    setUserFavorites(favoritePostIds);
  }

  async function toggleFavorite(postId: string, currentCount: number) {
    setIsToggling(postId);

    const { data: userData } = await user;
    if (!userData?.user) {
      toast.error("You must be logged in to favorite posts");
      setIsToggling(null);
      return;
    }

    const isFavorited = userFavorites.has(postId);

    if (isFavorited) {
      // Remove favorite
      const { error } = await supabase
        .from("post_favorites")
        .delete()
        .eq("user_id", userData.user.id)
        .eq("post_id", postId);

      if (!error) {
        setUserFavorites(prev => {
          const next = new Set(prev);
          next.delete(postId);
          return next;
        });
        updatePostCount(postId, currentCount - 1);
        toast.success("Removed from favorites");
      }
    } else {
      // Add favorite
      const { error } = await supabase
        .from("post_favorites")
        .insert({
          user_id: userData.user.id,
          post_id: postId,
        });

      if (!error) {
        setUserFavorites(prev => new Set(prev).add(postId));
        updatePostCount(postId, currentCount + 1);
        toast.success("Added to favorites!");
      }
    }

    setIsToggling(null);
  }

  function updatePostCount(postId: string, newCount: number) {
    setPosts(prev => prev.map(p => 
      p.id === postId ? { ...p, favorites_count: newCount } : p
    ));
  }

  function getBranchName(post: any) {
    if (!post.branch_id) return "All Branches";
    return post.branches?.name || "Unknown Branch";
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Company News & Announcements</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadPosts}
              disabled={loading}
            >
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          {/* Branch Filter */}
          <div className="mb-6">
            <label className="text-sm font-medium mb-2 block">Filter by Branch:</label>
            <select
              className="border rounded p-2 bg-white"
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              disabled={loading}
            >
              <option value="all">All News</option>
              <option value="null">Global Announcements</option>
            </select>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading news...</div>
          ) : posts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No news announcements yet.
            </div>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => {
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
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                              {getBranchName(post)}
                            </span>
                          </div>
                        </div>

                        {/* Favorite Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleFavorite(post.id, post.favorites_count || 0)}
                          disabled={isAnimating}
                          className={`ml-4 transition-all ${
                            isFavorited ? "text-red-500" : "text-gray-400"
                          } hover:text-red-500`}
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
                      <div className="text-gray-700 whitespace-pre-wrap">
                        {post.body}
                      </div>
                      
                      {post.image_url && (
                        <div className="mt-4">
                          <img 
                            src={post.image_url} 
                            alt={post.title}
                            className="max-w-full h-auto rounded-lg max-h-96 object-cover"
                            onError={(e) => e.currentTarget.style.display = 'none'}
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
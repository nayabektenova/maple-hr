"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function EmployeeNewsPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState<string>("all");

  useEffect(() => {
    loadPosts();
  }, [selectedBranch]);

  async function loadPosts() {
    setLoading(true);
    
    let query = supabase
      .from("news_posts")
      .select(`
        *,
        branches (
          name
        )
      `)
      .order("created_at", { ascending: false });

    // Filter by branch if selected (show global posts + branch-specific posts)
    if (selectedBranch !== "all") {
      query = query.or(`branch_id.eq.${selectedBranch},branch_id.is.null`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error loading posts:", error);
    } else {
      setPosts(data || []);
    }
    
    setLoading(false);
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
              {/* You can add specific branch filters here if needed */}
            </select>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">Loading news...</div>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500">No news announcements yet.</div>
              <div className="text-sm text-gray-400 mt-2">
                Check back later for updates from management.
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => (
                <Card key={post.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{post.title}</CardTitle>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span>{formatDate(post.created_at)}</span>
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                            {getBranchName(post)}
                          </span>
                        </div>
                      </div>
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
                          onError={(e) => {
                            // Hide image if it fails to load
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
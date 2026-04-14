"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { MessageSquare, ThumbsUp, Clock } from "lucide-react";
import Link from "next/link";
import { postsApi, type Post } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function FeedbackList() {
  const { data: session } = useSession();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    loadPosts();
  }, [filter]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const response = await postsApi.list(
        {
          itemsPerPage: 50,
          currentPageNumber: 0,
          sortOrder: "desc",
          filterBy: "",
        },
        filter !== "all" ? { status: filter as any } : undefined,
        session?.user?.accessToken
      );

      if (response.data?.posts) {
        setPosts(response.data.posts);
      }
    } catch (error) {
      console.error("Failed to load posts:", error);
      // Show user-friendly error message
      if (error instanceof Error && error.message.includes("connect")) {
        console.error("Backend API connection failed. Ensure it's running on port 4560");
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: "bg-blue-100 text-blue-700",
      planned: "bg-purple-100 text-purple-700",
      in_progress: "bg-yellow-100 text-yellow-700",
      completed: "bg-green-100 text-green-700",
      closed: "bg-gray-100 text-gray-700",
    };
    return colors[status] || colors.open;
  };

  const getTypeIcon = (type: string) => {
    return type === "bug_report" ? "🐛" : type === "feature_request" ? "✨" : "💬";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-[#1c0a0c]/60">Loading feedback...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs value={filter} onValueChange={setFilter} className="w-full">
        <TabsList className="bg-white border border-[#e399a3]/30">
          <TabsTrigger 
            value="all"
            className="data-active:bg-[#c74959] data-active:text-white data-active:hover:!text-white text-[#1c0a0c]/70 hover:!text-[#1c0a0c]/70"
          >
            All
          </TabsTrigger>
          <TabsTrigger 
            value="open"
            className="data-active:bg-[#c74959] data-active:text-white data-active:hover:!text-white text-[#1c0a0c]/70 hover:!text-[#1c0a0c]/70"
          >
            Open
          </TabsTrigger>
          <TabsTrigger 
            value="planned"
            className="data-active:bg-[#c74959] data-active:text-white data-active:hover:!text-white text-[#1c0a0c]/70 hover:!text-[#1c0a0c]/70"
          >
            Planned
          </TabsTrigger>
          <TabsTrigger 
            value="in_progress"
            className="data-active:bg-[#c74959] data-active:text-white data-active:hover:!text-white text-[#1c0a0c]/70 hover:!text-[#1c0a0c]/70"
          >
            In Progress
          </TabsTrigger>
          <TabsTrigger 
            value="completed"
            className="data-active:bg-[#c74959] data-active:text-white data-active:hover:!text-white text-[#1c0a0c]/70 hover:!text-[#1c0a0c]/70"
          >
            Completed
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {posts.length === 0 ? (
        <div className="rounded-xl border border-[#e399a3]/20 bg-white p-12 text-center">
          <p className="text-[#1c0a0c]/60">
            No feedback posts yet. Create your first one!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/dashboard/feedback/${post.id}`}
              className="block"
            >
              <div className="rounded-xl border border-[#e399a3]/20 bg-white p-4 transition-all hover:border-[#c74959]/40 hover:shadow-md">
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-12 w-12 flex-col gap-1 rounded-lg border-[#e399a3]/40 bg-white hover:border-[#c74959] hover:bg-[#fdf8f9]"
                    >
                      <ThumbsUp className="h-4 w-4 text-[#c74959]" />
                      <span className="text-xs font-semibold text-[#1c0a0c]">{post.vote_count}</span>
                    </Button>
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getTypeIcon(post.post_type)}</span>
                          <h3 className="font-semibold text-[#1c0a0c]">{post.title}</h3>
                        </div>
                        <p className="mt-1 line-clamp-2 text-sm text-[#1c0a0c]/70">
                          {post.description}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(post.status)}`}
                      >
                        {post.status.replace("_", " ")}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-[#1c0a0c]/60">
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {post.comment_count} comments
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        by {post.author_name}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

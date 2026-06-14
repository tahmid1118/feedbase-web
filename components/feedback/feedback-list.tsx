"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { MessageSquare, ThumbsUp, Clock, Search, Pin } from "lucide-react";
import Link from "next/link";
import {
  postsApi,
  tagsApi,
  votesApi,
  extractRows,
  type Post,
  type PostStatus,
  type PostType,
  type Tag,
} from "@/lib/api";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUS_BADGE: Record<string, string> = {
  open: "bg-blue-100 text-blue-700",
  planned: "bg-purple-100 text-purple-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  completed: "bg-green-100 text-green-700",
  closed: "bg-gray-100 text-gray-700",
};

const TYPE_ICON: Record<string, string> = {
  bug_report: "🐛",
  feature_request: "✨",
  feedback: "💬",
};

const TRIGGER_CLASS =
  "rounded-lg text-[#1c0a0c]/70 transition-colors data-[state=active]:bg-[#c74959] data-[state=active]:text-white data-[state=inactive]:hover:bg-[#c74959]/10 data-[state=inactive]:hover:text-[#c74959]";

interface FeedbackListProps {
  refreshKey?: number;
}

export function FeedbackList({ refreshKey = 0 }: FeedbackListProps) {
  const { data: session } = useSession();
  const [posts, setPosts] = useState<Post[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>("all");
  const [postType, setPostType] = useState<string>("all");
  const [tagId, setTagId] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const token = session?.user?.accessToken;

  // Debounce the search input so we don't fire a request per keystroke.
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(id);
  }, [search]);

  const loadPosts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await postsApi.list(
        { itemsPerPage: 100, currentPageNumber: 0, sortOrder: "desc", filterBy: "" },
        {
          ...(status !== "all" ? { status: status as PostStatus } : {}),
          ...(postType !== "all" ? { postType: postType as PostType } : {}),
          ...(tagId !== "all" ? { tagId: Number(tagId) } : {}),
          ...(debouncedSearch ? { search: debouncedSearch } : {}),
        },
        token
      );
      setPosts(extractRows<Post>(res.data, "posts"));
    } catch (error) {
      console.error("Failed to load posts:", error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [status, postType, tagId, debouncedSearch, token]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts, refreshKey]);

  useEffect(() => {
    tagsApi
      .list(token)
      .then((res) => setTags(extractRows<Tag>(res.data, "tags")))
      .catch(() => setTags([]));
  }, [token]);

  // Vote directly from the card without opening the detail page.
  const handleVote = async (post: Post) => {
    if (!token) {
      toast.error("Please login to vote");
      return;
    }
    const wasVoted = Boolean(post.has_voted);
    const delta = wasVoted ? -1 : 1;

    // Optimistic update.
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? { ...p, has_voted: !wasVoted, vote_count: Math.max(0, p.vote_count + delta) }
          : p
      )
    );

    try {
      if (wasVoted) await votesApi.remove(post.id, token);
      else await votesApi.add(post.id, token);
    } catch {
      // Roll back on failure.
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id
            ? { ...p, has_voted: wasVoted, vote_count: Math.max(0, p.vote_count - delta) }
            : p
        )
      );
      toast.error("Failed to vote");
    }
  };

  // Client-side fallbacks in case the backend ignores the search/tag filters.
  const visiblePosts = useMemo(() => {
    let result = posts;
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }
    // Pinned posts float to the top.
    return [...result].sort(
      (a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0)
    );
  }, [posts, debouncedSearch]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={status} onValueChange={setStatus}>
          <TabsList className="border border-[#e399a3]/30 bg-white">
            {["all", "open", "planned", "in_progress", "completed"].map((s) => (
              <TabsTrigger key={s} value={s} className={TRIGGER_CLASS}>
                {s === "all" ? "All" : s.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1c0a0c]/40" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search feedback..."
              className="w-48 pl-8"
            />
          </div>

          <Select value={postType} onValueChange={setPostType}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="feedback">💬 Feedback</SelectItem>
              <SelectItem value="feature_request">✨ Feature</SelectItem>
              <SelectItem value="bug_report">🐛 Bug</SelectItem>
            </SelectContent>
          </Select>

          {tags.length > 0 && (
            <Select value={tagId} onValueChange={setTagId}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All tags" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All tags</SelectItem>
                {tags.map((tag) => (
                  <SelectItem key={tag.id} value={String(tag.id)}>
                    {tag.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-[#1c0a0c]/60">
          Loading feedback...
        </div>
      ) : visiblePosts.length === 0 ? (
        <div className="rounded-xl border border-[#e399a3]/20 bg-white p-12 text-center text-[#1c0a0c]/60">
          No feedback posts match your filters.
        </div>
      ) : (
        <div className="space-y-3">
          {visiblePosts.map((post) => (
            <div
              key={post.id}
              className="relative isolate rounded-xl border border-[#e399a3]/20 bg-white p-4 transition-all hover:border-[#c74959]/40 hover:shadow-md"
            >
              {/* Stretched link: the whole card navigates, except elements above it. */}
              <Link
                href={`/dashboard/feedback/${post.id}`}
                aria-label={`Open ${post.title}`}
                className="absolute inset-0 z-[1] rounded-xl"
              />
              <div className="flex items-start gap-4">
                  <button
                    type="button"
                    onClick={() => handleVote(post)}
                    aria-label={post.has_voted ? "Remove vote" : "Upvote"}
                    aria-pressed={Boolean(post.has_voted)}
                    className={`group/vote relative z-[2] flex h-12 w-12 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border transition-all duration-150 active:scale-90 ${
                      post.has_voted
                        ? "border-[#c74959] bg-[#c74959] text-white hover:bg-[#b03f4d]"
                        : "border-[#e399a3]/40 bg-white text-[#1c0a0c] hover:border-[#c74959] hover:bg-[#c74959]/10 hover:shadow-sm"
                    }`}
                  >
                    <ThumbsUp
                      className={`h-4 w-4 transition-transform duration-150 group-hover/vote:-translate-y-0.5 group-hover/vote:scale-125 ${
                        post.has_voted
                          ? "fill-white text-white"
                          : "text-[#c74959] group-hover/vote:fill-[#c74959]/30"
                      }`}
                    />
                    <span
                      className={`text-xs font-semibold transition-colors ${
                        post.has_voted ? "" : "group-hover/vote:text-[#c74959]"
                      }`}
                    >
                      {post.vote_count}
                    </span>
                  </button>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {TYPE_ICON[post.post_type] ?? "💬"}
                          </span>
                          <h3 className="font-semibold text-[#1c0a0c]">
                            {post.title}
                          </h3>
                          {post.is_pinned ? (
                            <Pin className="h-3.5 w-3.5 fill-[#c74959] text-[#c74959]" />
                          ) : null}
                        </div>
                        <p className="mt-1 line-clamp-2 text-sm text-[#1c0a0c]/70">
                          {post.description}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_BADGE[post.status]}`}
                      >
                        {post.status.replace("_", " ")}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#1c0a0c]/60">
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {post.comment_count} comments
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        by {post.author_name}
                      </span>
                      {post.tags?.map((tag) => (
                        <Badge
                          key={tag.id}
                          variant="outline"
                          className="border-[#e399a3]/40"
                          style={
                            tag.color_hex
                              ? { color: tag.color_hex, borderColor: tag.color_hex }
                              : undefined
                          }
                        >
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

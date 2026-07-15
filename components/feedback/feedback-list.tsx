"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import {
  MessageSquare,
  ThumbsUp,
  Clock,
  Search,
  Pin,
  GitBranch,
  ArrowUpDown,
  Paperclip,
} from "lucide-react";
import Link from "next/link";
import {
  postsApi,
  tagsApi,
  votesApi,
  roadmapApi,
  extractRows,
  BOARD_SORT_OPTIONS,
  type BoardSort,
  type Post,
  type PostStatus,
  type PostType,
  type Tag,
  type RoadmapColumn,
  type RoadmapItem,
} from "@/lib/api";
import { toast } from "sonner";
import { useRefetchOnFocus } from "@/lib/hooks/use-refetch-on-focus";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const [sort, setSort] = useState<BoardSort>("newest");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Bulk "send to roadmap" selection (Open tab only).
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [columns, setColumns] = useState<RoadmapColumn[]>([]);
  const [roadmapItems, setRoadmapItems] = useState<RoadmapItem[]>([]);
  const [sendOpen, setSendOpen] = useState(false);
  const [sendColumnId, setSendColumnId] = useState("");
  const [sendDate, setSendDate] = useState("");
  const [sending, setSending] = useState(false);

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
        {
          itemsPerPage: 100,
          currentPageNumber: 0,
          sortOrder: "desc",
          filterBy: "",
          sortBy: sort,
        },
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
  }, [status, postType, tagId, debouncedSearch, sort, token]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts, refreshKey]);

  // Reflect changes made elsewhere (e.g. status updated from the roadmap) when
  // the user returns to this page.
  useRefetchOnFocus(loadPosts);

  useEffect(() => {
    if (!token) return;
    tagsApi
      .list(token)
      .then((res) => setTags(extractRows<Tag>(res.data, "tags")))
      .catch(() => setTags([]));
  }, [token]);

  // Roadmap columns + items: target column choices, and which posts are already
  // on the roadmap (so we don't add them twice).
  const loadRoadmap = useCallback(() => {
    if (!token) return;
    Promise.all([roadmapApi.getColumns(token), roadmapApi.getItems(token)])
      .then(([colRes, itemRes]) => {
        setColumns(extractRows<RoadmapColumn>(colRes.data, "columns"));
        setRoadmapItems(extractRows<RoadmapItem>(itemRes.data, "items"));
      })
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    loadRoadmap();
  }, [loadRoadmap]);

  // Bulk selection only applies to the Open tab; clear it when leaving.
  useEffect(() => {
    if (status !== "open") setSelected(new Set());
  }, [status]);

  const onRoadmap = useMemo(
    () => new Set(roadmapItems.map((i) => i.post_id)),
    [roadmapItems]
  );

  // Vote directly from the card without opening the detail page.
  const handleVote = async (post: Post) => {
    if (!token) {
      toast.error("Please login to vote");
      return;
    }
    const wasVoted = Boolean(post.has_voted);
    const delta = wasVoted ? -1 : 1;

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
    return [...result].sort(
      (a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0)
    );
  }, [posts, debouncedSearch]);

  // --- Selection ---
  const selectionEnabled = status === "open";
  const selectablePosts = useMemo(
    () => visiblePosts.filter((p) => !onRoadmap.has(p.id)),
    [visiblePosts, onRoadmap]
  );
  const allSelected =
    selectablePosts.length > 0 &&
    selectablePosts.every((p) => selected.has(p.id));

  const toggleOne = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected((prev) =>
      allSelected ? new Set() : new Set([...prev, ...selectablePosts.map((p) => p.id)])
    );
  };

  const clearSelection = () => setSelected(new Set());

  const handleSend = async () => {
    if (!token || !sendColumnId) return;
    const columnId = Number(sendColumnId);
    const ids = [...selected].filter((id) => !onRoadmap.has(id));
    if (ids.length === 0) {
      toast.error("Those posts are already on the roadmap.");
      return;
    }

    setSending(true);
    const base = roadmapItems.filter(
      (i) => i.roadmap_column_id === columnId
    ).length;

    let ok = 0;
    let fail = 0;
    for (let i = 0; i < ids.length; i++) {
      try {
        await roadmapApi.addItem(
          {
            postId: ids[i],
            roadmapColumnId: columnId,
            sortOrder: base + i + 1,
            ...(sendDate ? { targetReleaseDate: sendDate } : {}),
          },
          token
        );
        ok++;
      } catch {
        fail++;
      }
    }

    setSending(false);
    setSendOpen(false);
    setSendDate("");
    setSendColumnId("");
    clearSelection();
    loadRoadmap();
    loadPosts(); // sending to a status column changes status — reflect in tabs

    if (ok > 0) {
      toast.success(
        `Added ${ok} ${ok === 1 ? "post" : "posts"} to the roadmap` +
          (fail ? ` · ${fail} failed` : "")
      );
    } else {
      toast.error("Failed to add posts to the roadmap.");
    }
  };

  const selectedCount = selected.size;
  const sortedColumns = useMemo(
    () => [...columns].sort((a, b) => a.sort_order - b.sort_order),
    [columns]
  );

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

          <Select
            value={sort}
            onValueChange={(v) => setSort(v as BoardSort)}
          >
            <SelectTrigger className="w-[165px]">
              <ArrowUpDown className="h-4 w-4 text-[#1c0a0c]/40" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BOARD_SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

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

      {/* Bulk selection / send-to-roadmap bar (Open tab only) */}
      {selectionEnabled && !loading && visiblePosts.length > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-[#e399a3]/20 bg-white px-3 py-2">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-[#1c0a0c]/70">
            <Checkbox
              checked={allSelected}
              onCheckedChange={toggleAll}
              disabled={selectablePosts.length === 0}
              aria-label="Select all feedback"
            />
            {selectedCount > 0 ? `${selectedCount} selected` : "Select all"}
          </label>

          {selectedCount > 0 && (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={clearSelection}>
                Clear
              </Button>
              <Button
                size="sm"
                className="bg-[#c74959] text-white hover:bg-[#b03f4d]"
                onClick={() => setSendOpen(true)}
              >
                <GitBranch className="h-4 w-4" />
                Send to Roadmap
              </Button>
            </div>
          )}
        </div>
      )}

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
          {visiblePosts.map((post) => {
            const isOnRoadmap = onRoadmap.has(post.id);
            return (
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
                <div className="flex items-start gap-3">
                  {selectionEnabled && (
                    <div className="relative z-[2] flex items-center pt-1">
                      <Checkbox
                        checked={selected.has(post.id)}
                        disabled={isOnRoadmap}
                        onCheckedChange={() => toggleOne(post.id)}
                        aria-label={
                          isOnRoadmap
                            ? `${post.title} is already on the roadmap`
                            : `Select ${post.title}`
                        }
                        title={isOnRoadmap ? "Already on the roadmap" : undefined}
                      />
                    </div>
                  )}

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
                          {isOnRoadmap && (
                            <span className="relative z-[2] inline-flex items-center gap-1 rounded-full bg-[#c74959]/10 px-2 py-0.5 text-[10px] font-medium text-[#c74959]">
                              <GitBranch className="h-3 w-3" />
                              On roadmap
                            </span>
                          )}
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
                      {(post.attachment_count ?? 0) > 0 && (
                        <span className="flex items-center gap-1">
                          <Paperclip className="h-3 w-3" />
                          {post.attachment_count}
                        </span>
                      )}
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
            );
          })}
        </div>
      )}

      {/* Send to roadmap dialog */}
      <Dialog open={sendOpen} onOpenChange={setSendOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Send to Roadmap</DialogTitle>
            <DialogDescription>
              Add {selectedCount} selected{" "}
              {selectedCount === 1 ? "post" : "posts"} to a roadmap column.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Column</Label>
              {sortedColumns.length === 0 ? (
                <p className="text-sm text-[#1c0a0c]/50">
                  No roadmap columns yet — create one on the Roadmap page first.
                </p>
              ) : (
                <Select value={sendColumnId} onValueChange={setSendColumnId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a column" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortedColumns.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="send-date">Target release date (optional)</Label>
              <Input
                id="send-date"
                type="date"
                value={sendDate}
                onChange={(e) => setSendDate(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSendOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={sending || !sendColumnId}
              className="bg-[#c74959] text-white hover:bg-[#b03f4d]"
            >
              {sending ? "Sending..." : `Add ${selectedCount}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

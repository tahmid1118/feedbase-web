"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  Ban,
  RotateCcw,
  Loader2,
  ShieldCheck,
  ShieldAlert,
  Trash2,
} from "@/components/icons";
import Link from "next/link";
import {
  postsApi,
  tagsApi,
  roadmapApi,
  extractRows,
  extractTotal,
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
import { useTranslation } from "@/lib/i18n/client";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PostTypeIcon } from "@/components/feedback/post-type-icon";

const STATUS_BADGE: Record<string, string> = {
  open: "bg-blue-100 text-blue-700",
  planned: "bg-purple-100 text-purple-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  completed: "bg-green-100 text-green-700",
  closed: "bg-gray-100 text-gray-700",
  rejected: "bg-red-100 text-red-700",
};

const TRIGGER_CLASS =
  "rounded-lg text-[#1c0a0c]/70 transition-colors data-[state=active]:bg-[#c74959] data-[state=active]:text-white data-[state=inactive]:hover:bg-[#c74959]/10 data-[state=inactive]:hover:text-[#c74959]";

interface FeedbackListProps {
  refreshKey?: number;
}

// Posts fetched per page, both on initial load and each "load more" tick.
const PAGE_SIZE = 20;

/**
 * Explains a spam flag on a queue row: whether the post was hidden or merely
 * flagged, and which signals fired.
 *
 * Reason codes come from the backend's spamScore.js and are translated via
 * `spamReason.<code>`, falling back to the raw code so a signal added on the
 * server still renders something meaningful before its translation lands —
 * better a moderator sees "several_links" than a blank chip.
 */
function SpamReasons({
  score,
  reasons,
  quarantined,
  t,
}: {
  score?: number;
  reasons?: string | null;
  quarantined: boolean;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  let codes: string[] = [];
  try {
    // Stored as a JSON array of strings; tolerate anything else.
    const parsed = reasons ? JSON.parse(reasons) : [];
    if (Array.isArray(parsed)) codes = parsed.filter((c) => typeof c === "string");
  } catch {
    /* malformed — show the state chip without reasons rather than break the row */
  }

  return (
    <div className="relative z-[2] mt-2 flex flex-wrap items-center gap-1.5">
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
          quarantined
            ? "bg-red-100 text-red-700"
            : "bg-amber-100 text-amber-700"
        }`}
      >
        <ShieldAlert className="h-3 w-3" />
        {quarantined ? t("feedback.spamHidden") : t("feedback.spamFlagged")}
        {typeof score === "number" ? ` · ${score}` : ""}
      </span>
      {codes.map((code) => (
        <span
          key={code}
          className="rounded-full bg-[#1c0a0c]/5 px-2 py-0.5 text-[10px] text-[#1c0a0c]/60"
        >
          {t(`spamReason.${code}`, { defaultValue: code.replace(/_/g, " ") })}
        </span>
      ))}
    </div>
  );
}

export function FeedbackList({ refreshKey = 0 }: FeedbackListProps) {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [status, setStatus] = useState<string>("all");
  const [postType, setPostType] = useState<string>("all");
  const [tagId, setTagId] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<BoardSort>("newest");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Bulk "send to roadmap" selection (Open tab only).
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [columns, setColumns] = useState<RoadmapColumn[]>([]);
  const [roadmapItems, setRoadmapItems] = useState<RoadmapItem[]>([]);
  const [sendOpen, setSendOpen] = useState(false);
  const [sendColumnId, setSendColumnId] = useState("");
  const [sendDate, setSendDate] = useState("");
  const [sending, setSending] = useState(false);
  // Bulk reject (Open tab) / restore (Rejected tab).
  const [statusBusy, setStatusBusy] = useState(false);
  // Spam tab: confirm before the one irreversible action in the queue.
  const [confirmPurge, setConfirmPurge] = useState(false);

  const token = session?.user?.accessToken;

  // Debounce the search input so we don't fire a request per keystroke.
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(id);
  }, [search]);

  // "spam" is NOT a post status — it's the separate moderation axis — so the
  // Spam tab sends `moderation` instead of `status`. Every other tab omits it,
  // which is what keeps quarantined posts out of the normal board.
  const filters = useMemo(
    () => ({
      ...(status === "spam"
        ? { moderation: "spam" as const }
        : status !== "all"
          ? { status: status as PostStatus }
          : {}),
      ...(postType !== "all" ? { postType: postType as PostType } : {}),
      ...(tagId !== "all" ? { tagId: Number(tagId) } : {}),
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
    }),
    [status, postType, tagId, debouncedSearch]
  );

  // Full reset: fires on filter/sort change, the refreshKey bump, and
  // window refocus (via useRefetchOnFocus below). Always starts from page 0
  // and replaces the whole list — loadMore (below) is the only path that
  // appends.
  const loadPosts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await postsApi.list(
        {
          itemsPerPage: PAGE_SIZE,
          currentPageNumber: 0,
          sortOrder: "desc",
          filterBy: "",
          sortBy: sort,
        },
        filters,
        token
      );
      setPosts(extractRows<Post>(res.data, "posts"));
      setTotal(extractTotal(res.data));
    } catch (error) {
      console.error("Failed to load posts:", error);
      setPosts([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [filters, sort, token]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts, refreshKey]);

  // Reflect changes made elsewhere (e.g. status updated from the roadmap) when
  // the user returns to this page.
  useRefetchOnFocus(loadPosts);

  // Appends the next page instead of replacing. Guarded against re-entrancy
  // (loading/loadingMore) and against firing once every row is already on
  // screen (posts.length >= total).
  //
  // currentPageNumber, not a raw offset: the backend's `paginationData`
  // middleware (shared by every authenticated list endpoint) REBUILDS the
  // pagination object server-side and computes
  // `offset = itemsPerPage * currentPageNumber` itself, discarding any
  // offset the client sends. posts.length is always an exact multiple of
  // PAGE_SIZE here (loadMore only ever appends full pages, and stops once
  // the final partial page lands), so dividing it back into a page index is
  // exact, not an approximation.
  const loadMore = useCallback(async () => {
    if (loading || loadingMore || posts.length >= total) return;
    setLoadingMore(true);
    try {
      const res = await postsApi.list(
        {
          itemsPerPage: PAGE_SIZE,
          currentPageNumber: Math.floor(posts.length / PAGE_SIZE),
          sortOrder: "desc",
          filterBy: "",
          sortBy: sort,
        },
        filters,
        token
      );
      setPosts((prev) => [...prev, ...extractRows<Post>(res.data, "posts")]);
      setTotal(extractTotal(res.data));
    } catch (error) {
      console.error("Failed to load more posts:", error);
    } finally {
      setLoadingMore(false);
    }
  }, [loading, loadingMore, posts.length, total, sort, filters, token]);

  // IntersectionObserver on a sentinel div after the list — scrolling it into
  // view loads the next page. Re-created whenever loadMore changes identity
  // (new filters/sort/page) so the callback it holds is never stale.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "400px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

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

  // Selection is per-tab — clear it whenever the tab changes.
  useEffect(() => {
    setSelected(new Set());
  }, [status]);

  const onRoadmap = useMemo(
    () => new Set(roadmapItems.map((i) => i.post_id)),
    [roadmapItems]
  );

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

  // --- Selection --- (Open → send-to-roadmap/reject; Rejected → restore;
  // Spam → not-spam/delete)
  const selectionEnabled =
    status === "open" || status === "rejected" || status === "spam";
  const selectablePosts = useMemo(
    // On the Open tab, posts already on the roadmap can't be re-sent; on the
    // Rejected tab everything is selectable.
    () =>
      status === "open"
        ? visiblePosts.filter((p) => !onRoadmap.has(p.id))
        : visiblePosts,
    [status, visiblePosts, onRoadmap]
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
      toast.error(t("feedback.alreadyOnRoadmapToast"));
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
      toast.error(t("feedback.addFailed"));
    }
  };

  // Bulk status change for the selected posts (reject → 'rejected', restore →
  // 'open'). Both are reversible, so no confirm dialog.
  const bulkSetStatus = async (
    newStatus: PostStatus,
    pastVerb: string
  ) => {
    if (!token || selected.size === 0) return;
    const ids = [...selected];
    setStatusBusy(true);
    let ok = 0;
    let fail = 0;
    for (const id of ids) {
      try {
        await postsApi.updateStatus(id, newStatus, token);
        ok++;
      } catch {
        fail++;
      }
    }
    setStatusBusy(false);
    clearSelection();
    loadPosts(); // the posts leave this tab
    if (ok > 0) {
      toast.success(
        `${pastVerb} ${ok} ${ok === 1 ? "post" : "posts"}` +
          (fail ? ` · ${fail} failed` : "")
      );
    } else {
      toast.error(t("feedback.updateFailed", { count: ids.length }));
    }
  };

  const handleReject = () => bulkSetStatus("rejected", "Rejected");
  const handleRestore = () => bulkSetStatus("open", "Restored");

  /**
   * "Not spam" — the human override. Republishes AND clears the score
   * server-side, so the post leaves the queue permanently instead of
   * reappearing on every visit.
   *
   * This is what makes automatic quarantine defensible: a false positive costs
   * one click, not a lost customer message.
   */
  /**
   * Permanently delete the selected QUARANTINED posts.
   *
   * Two guards, because this is the one irreversible action in the queue:
   * the server refuses anything not already `moderation_state = 'spam'` (so a
   * flagged-but-published post sharing this tab can't be swept up), and the
   * button only counts those items, so the confirm dialog states a number the
   * user can trust.
   */
  const quarantinedSelected = useMemo(
    () =>
      visiblePosts.filter(
        (p) => selected.has(p.id) && p.moderation_state === "spam"
      ),
    [visiblePosts, selected]
  );

  const handleDeleteSpam = async () => {
    if (!token || quarantinedSelected.length === 0) return;
    setStatusBusy(true);
    try {
      const res = await postsApi.purgeSpam(
        { ids: quarantinedSelected.map((p) => p.id) },
        token
      );
      const deleted = res.data?.deleted ?? quarantinedSelected.length;
      toast.success(t("feedback.spamDeleted", { count: deleted }));
      clearSelection();
      loadPosts();
    } catch {
      toast.error(t("feedback.updateFailed", { count: quarantinedSelected.length }));
    } finally {
      setStatusBusy(false);
      setConfirmPurge(false);
    }
  };

  const handleNotSpam = async () => {
    if (!token || selected.size === 0) return;
    const ids = [...selected];
    setStatusBusy(true);
    let ok = 0;
    let fail = 0;
    for (const id of ids) {
      try {
        await postsApi.updateModeration(id, "published", token);
        ok++;
      } catch {
        fail++;
      }
    }
    setStatusBusy(false);
    clearSelection();
    loadPosts();
    if (ok > 0) {
      toast.success(
        t("feedback.notSpamDone", { count: ok }) +
          (fail ? ` · ${fail} failed` : "")
      );
    } else {
      toast.error(t("feedback.updateFailed", { count: ids.length }));
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
        <Tabs value={status} onValueChange={setStatus} className="min-w-0">
          {/* Six pills are wider than a phone. `TabsList` is an inline-flex with
              no overflow handling, so "Rejected" was simply clipped off the edge
              and unreachable. Scroll the row instead (same approach as the
              Settings tab rail), bleeding to the screen edges on mobile so the
              last pill isn't hidden under the page gutter. */}
          <div className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:overflow-visible sm:px-0 sm:pb-0">
            <TabsList className="min-w-max border border-[#e399a3]/30 bg-white">
              {["all", "open", "planned", "in_progress", "completed", "rejected", "spam"].map((s) => (
                <TabsTrigger key={s} value={s} className={TRIGGER_CLASS}>
                  {s === "spam" ? t("feedback.spamTab") : t(`status.${s}`)}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </Tabs>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1c0a0c]/40" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("feedback.searchPlaceholder")}
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
                  {t(o.labelKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={postType} onValueChange={setPostType}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder={t("feedback.allTypes")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("feedback.allTypes")}</SelectItem>
              <SelectItem value="feedback">
                <PostTypeIcon type="feedback" />
                {t("feedback.typeFeedback")}
              </SelectItem>
              <SelectItem value="feature_request">
                <PostTypeIcon type="feature_request" />
                {t("feedback.typeFeature")}
              </SelectItem>
              <SelectItem value="bug_report">
                <PostTypeIcon type="bug_report" />
                {t("feedback.typeBug")}
              </SelectItem>
            </SelectContent>
          </Select>

          {tags.length > 0 && (
            <Select value={tagId} onValueChange={setTagId}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder={t("feedback.allTags")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("feedback.allTags")}</SelectItem>
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
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#e399a3]/20 bg-white px-3 py-2">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-[#1c0a0c]/70">
            <Checkbox
              checked={allSelected}
              onCheckedChange={toggleAll}
              disabled={selectablePosts.length === 0}
              aria-label={t("feedback.selectAll")}
            />
            {selectedCount > 0 ? t("feedback.nSelected", { count: selectedCount }) : t("feedback.selectAll")}
          </label>

          {/* flex-wrap: on a narrow phone, "Clear" + "Reject" + "Send to
              Roadmap" together are wider than the bar. They previously ran
              off the right edge of the screen with no way to reach them —
              wrapping onto a second line keeps every action reachable. */}
          {selectedCount > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="ghost" size="sm" onClick={clearSelection}>
                {t("common.clear")}
              </Button>
              {status === "spam" ? (
                <>
                  {/* Restore first and styled as the primary action: the safe,
                      reversible choice should be the easy one to hit. */}
                  <Button
                    size="sm"
                    className="bg-[#c74959] text-white hover:bg-[#b03f4d]"
                    onClick={handleNotSpam}
                    disabled={statusBusy}
                  >
                    <ShieldCheck className="h-4 w-4" />
                    {statusBusy ? t("feedback.restoring") : t("feedback.notSpam")}
                  </Button>
                  {/* Only offered when the selection actually contains hidden
                      spam — selecting a flagged-but-published post gives you
                      nothing to delete, matching what the server will do. */}
                  {quarantinedSelected.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => setConfirmPurge(true)}
                      disabled={statusBusy}
                    >
                      <Trash2 className="h-4 w-4" />
                      {t("feedback.deleteSpam", {
                        count: quarantinedSelected.length,
                      })}
                    </Button>
                  )}
                </>
              ) : status === "rejected" ? (
                <Button
                  size="sm"
                  className="bg-[#c74959] text-white hover:bg-[#b03f4d]"
                  onClick={handleRestore}
                  disabled={statusBusy}
                >
                  <RotateCcw className="h-4 w-4" />
                  {statusBusy ? t("feedback.restoring") : t("feedback.restoreToOpen")}
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReject}
                    disabled={statusBusy}
                  >
                    <Ban className="h-4 w-4" />
                    {statusBusy ? t("feedback.rejecting") : t("feedback.reject")}
                  </Button>
                  <Button
                    size="sm"
                    className="bg-[#c74959] text-white hover:bg-[#b03f4d]"
                    onClick={() => setSendOpen(true)}
                    disabled={statusBusy}
                  >
                    <GitBranch className="h-4 w-4" />{t("feedback.sendToRoadmap")}</Button>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12 text-[#1c0a0c]/60">
          {t("feedback.loadingFeedback")}
        </div>
      ) : visiblePosts.length === 0 ? (
        <div className="rounded-xl border border-[#e399a3]/20 bg-white p-12 text-center text-[#1c0a0c]/60">
          {t("feedback.noMatch")}
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
                  aria-label={t("portal.openPost", { title: post.title })}
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
                            : t("feedback.selectPost", { title: post.title })
                        }
                        title={isOnRoadmap ? t("feedback.alreadyOnRoadmap") : undefined}
                      />
                    </div>
                  )}

                  {/* Read-only tally: only the public board votes, never the team. */}
                  <div
                    aria-label={`${post.vote_count} ${post.vote_count === 1 ? "upvote" : "upvotes"}`}
                    title={t("postDetail.upvoteTitle")}
                    className="relative z-[2] flex h-12 w-12 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-[#e399a3]/40 bg-white text-[#1c0a0c]"
                  >
                    <ThumbsUp className="h-4 w-4 text-[#c74959]" />
                    <span className="text-xs font-semibold">{post.vote_count}</span>
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <PostTypeIcon
                            type={post.post_type}
                            className="h-4 w-4 shrink-0 text-[#1c0a0c]/50"
                          />
                          <h3 className="font-semibold text-[#1c0a0c]">
                            {post.title}
                          </h3>
                          {post.is_pinned ? (
                            <Pin className="h-3.5 w-3.5 fill-[#c74959] text-[#c74959]" />
                          ) : null}
                          {isOnRoadmap && (
                            <span className="relative z-[2] inline-flex items-center gap-1 rounded-full bg-[#c74959]/10 px-2 py-0.5 text-[10px] font-medium text-[#c74959]">
                              <GitBranch className="h-3 w-3" />
                              {t("feedback.onRoadmap")}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 line-clamp-2 text-sm text-[#1c0a0c]/70">
                          {post.description}
                        </p>
                        {/* WHY it was flagged. A verdict with no explanation is
                            impossible to review fairly — the moderator needs to
                            see "5 links + throwaway inbox" to judge in a glance,
                            and reason codes are also how we spot a mis-tuned
                            weight from real traffic. */}
                        {status === "spam" && (
                          <SpamReasons
                            score={post.spam_score}
                            reasons={post.spam_reasons}
                            quarantined={post.moderation_state === "spam"}
                            t={t}
                          />
                        )}
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_BADGE[post.status]}`}
                      >
                        {t(`status.${post.status}`)}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#1c0a0c]/60">
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {t("portal.nComments", { count: post.comment_count ?? 0 })}
                      </span>
                      {(post.attachment_count ?? 0) > 0 && (
                        <span className="flex items-center gap-1">
                          <Paperclip className="h-3 w-3" />
                          {post.attachment_count}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {t("portal.byAuthor", { name: post.author_name })}
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

      {/* Infinite scroll: an empty sentinel the IntersectionObserver watches,
          plus a spinner while a page is in flight. Only rendered once there's
          an initial page to append to and more rows exist beyond it. */}
      {!loading && posts.length > 0 && posts.length < total && (
        <div ref={sentinelRef} className="flex justify-center py-6">
          {loadingMore && (
            <Loader2 className="h-5 w-5 animate-spin text-[#c74959]/60" />
          )}
        </div>
      )}

      {/* Send to roadmap dialog */}
      <Dialog open={sendOpen} onOpenChange={setSendOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>{t("feedback.sendToRoadmap")}</DialogTitle>
            <DialogDescription>
              Add {selectedCount} selected{" "}
              {selectedCount === 1 ? "post" : "posts"} to a roadmap column.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("feedback.column")}</Label>
              {sortedColumns.length === 0 ? (
                <p className="text-sm text-[#1c0a0c]/50">
                  No roadmap columns yet — create one on the Roadmap page first.
                </p>
              ) : (
                <Select value={sendColumnId} onValueChange={setSendColumnId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("feedback.selectColumn")} />
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
              <Label htmlFor="send-date">{t("feedback.targetReleaseDate")}</Label>
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
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleSend}
              disabled={sending || !sendColumnId}
              className="bg-[#c74959] text-white hover:bg-[#b03f4d]"
            >
              {sending ? t("feedback.sending") : t("feedback.addN", { count: selectedCount })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deleting quarantined spam is the only irreversible action in the queue,
          so it gets an explicit confirm that names the exact count and says
          plainly that it cannot be undone. */}
      <AlertDialog open={confirmPurge} onOpenChange={setConfirmPurge}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("feedback.deleteSpamTitle", {
                count: quarantinedSelected.length,
              })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("feedback.deleteSpamDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDeleteSpam}>
              {statusBusy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t("common.delete")
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

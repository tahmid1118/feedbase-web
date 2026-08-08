"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Loader2, MessageSquare, Paperclip } from "lucide-react";
import { publicApi } from "@/lib/api/public";
import type { Post, PostStatus, BoardSort } from "@/lib/api/types";
import { Badge } from "@/components/ui/badge";
import { PostTypeIcon } from "@/components/feedback/post-type-icon";
import { PortalVoteButton } from "@/components/portal/portal-vote-button";
import { LocalTime } from "@/components/local-time";
import { useTranslation } from "@/lib/i18n/client";

const STATUS_BADGE: Record<string, string> = {
  open: "bg-blue-100 text-blue-700",
  planned: "bg-purple-100 text-purple-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  completed: "bg-green-100 text-green-700",
  closed: "bg-gray-100 text-gray-700",
  rejected: "bg-red-100 text-red-700",
};

// Posts fetched per "load more" tick, matching the initial server-rendered page.
const PAGE_SIZE = 20;

interface BoardListProps {
  tenant: string;
  initialPosts: Post[];
  initialTotal: number;
  status: string;
  sort: BoardSort;
  brand: string;
}

/**
 * The public board's post list, split out of app/portal/[tenant]/page.tsx into
 * a client component so it can infinite-scroll. The first page is still
 * server-rendered (initialPosts/initialTotal) for a fast first paint and SEO;
 * this component only takes over once the visitor scrolls near the bottom.
 *
 * The parent page keys this component on `${status}-${sort}` so switching
 * tabs/sort remounts it fresh with the new initial page, rather than trying
 * to reconcile accumulated state from a different filter.
 */
export function BoardList({
  tenant,
  initialPosts,
  initialTotal,
  status,
  sort,
  brand,
}: BoardListProps) {
  const { t } = useTranslation();
  const [posts, setPosts] = useState(initialPosts);
  const [total, setTotal] = useState(initialTotal);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // `useState(initialPosts)` only consumes that value on the INITIAL mount —
  // React never re-runs it when the prop changes on a later render. Submitting
  // feedback calls `router.refresh()`, which re-runs the server-rendered parent
  // and hands this component a fresh `initialPosts`/`initialTotal` (same key,
  // so no remount), but without this the new post silently never appeared
  // until a full manual reload. Same reset-to-page-1 tradeoff the parent
  // already makes on a filter/sort change — any further-scrolled pages are
  // dropped in favor of showing the just-submitted post.
  useEffect(() => {
    setPosts(initialPosts);
    setTotal(initialTotal);
  }, [initialPosts, initialTotal]);

  const filters =
    status === "all" ? undefined : { status: status as PostStatus };

  const loadMore = useCallback(async () => {
    if (loadingMore || posts.length >= total) return;
    setLoadingMore(true);
    try {
      const data = await publicApi.getBoard(
        tenant,
        filters,
        PAGE_SIZE,
        sort,
        posts.length
      );
      setPosts((prev) => [...prev, ...(data?.posts ?? [])]);
      setTotal(data?.total ?? total);
    } finally {
      setLoadingMore(false);
    }
    // filters is a fresh object every render (derived from `status`), so it
    // isn't a stable dependency — depend on `status` itself instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingMore, posts.length, total, tenant, status, sort]);

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

  if (posts.length === 0) {
    return (
      <div className="rounded-xl border border-black/5 bg-white p-8 text-center sm:p-12 text-[#1c0a0c]/60">
        {t(status === "all" ? "portal.noFeedbackYet" : "portal.noMatchingPosts")}
      </div>
    );
  }

  return (
    <>
      {posts.map((post) => (
        <div
          key={post.id}
          className="relative isolate rounded-xl border border-black/5 bg-white p-4 transition-shadow hover:shadow-md"
        >
          <Link
            href={`/portal/${tenant}/post/${post.id}`}
            aria-label={t("portal.openPost", { title: post.title })}
            className="absolute inset-0 z-[1] rounded-xl"
          />
          <div className="flex items-start gap-3 sm:gap-4">
            <PortalVoteButton
              tenant={tenant}
              postId={post.id}
              initialCount={post.vote_count}
              brand={brand}
            />

            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between gap-2 sm:gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <PostTypeIcon
                      type={post.post_type}
                      className="h-4 w-4 shrink-0 text-[#1c0a0c]/50"
                    />
                    <h3 className="font-semibold text-[#1c0a0c]">
                      {post.title}
                    </h3>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-[#1c0a0c]/70">
                    {post.description}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium sm:px-3 sm:py-1 sm:text-xs ${STATUS_BADGE[post.status]}`}
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
                {post.created_at && <LocalTime date={post.created_at} relative />}
                {post.tags?.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="outline"
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

      {posts.length < total && (
        <div ref={sentinelRef} className="flex justify-center py-6">
          {loadingMore && (
            <Loader2
              className="h-5 w-5 animate-spin"
              style={{ color: `${brand}99` }}
            />
          )}
        </div>
      )}
    </>
  );
}

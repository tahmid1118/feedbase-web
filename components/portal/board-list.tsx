"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Loader2, MessageSquare, Paperclip } from "@/components/icons";
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
          className="relative isolate rounded-xl border border-black/5 bg-white p-2 transition-shadow hover:shadow-md sm:p-4"
        >
          <Link
            href={`/portal/${tenant}/post/${post.id}`}
            aria-label={t("portal.openPost", { title: post.title })}
            className="absolute inset-0 z-[1] rounded-xl"
          />
          <div className="flex items-start gap-2 sm:gap-4">
            <PortalVoteButton
              tenant={tenant}
              postId={post.id}
              initialCount={post.vote_count}
              brand={brand}
            />

            <div className="min-w-0 flex-1 space-y-0.5 sm:space-y-2">
              {/* ONLY the title shares this row with the status badge. The
                  description used to live in here too, so it stopped where the
                  badge started and left the area beneath the badge empty —
                  it's a sibling below now, at the card's full width. */}
              <div className="flex items-start justify-between gap-2 sm:gap-3">
                {/* flex-1 + min-w-0: without BOTH, this column keeps its
                    max-content width and the title runs underneath the status
                    badge instead of wrapping beside it.
                    items-START, not center: a title that wraps to 2-3 lines
                    would otherwise float the type icon against the middle
                    line, reading as a stray glyph rather than a label for
                    the post. The small top margin optically centers it on
                    the first line. */}
                <div className="flex min-w-0 flex-1 items-start gap-1.5 sm:gap-2">
                  <PostTypeIcon
                    type={post.post_type}
                    className="mt-[3px] h-3 w-3 shrink-0 text-[#1c0a0c]/50 sm:mt-1 sm:h-4 sm:w-4"
                  />
                  {/* break-words is load-bearing, not defensive: a title like
                      "Progress/Calendar/Customization" is one unbroken token
                      to the line breaker, so without it the word overflows
                      the column and is overlapped by the status badge. */}
                  <h3 className="min-w-0 text-[13.5px] leading-tight font-semibold break-words text-[#1c0a0c] sm:text-base sm:leading-normal">
                    {post.title}
                  </h3>
                </div>
                <span
                  className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium sm:px-3 sm:py-1 sm:text-xs ${STATUS_BADGE[post.status]}`}
                >
                  {t(`status.${post.status}`)}
                </span>
              </div>

              <p className="line-clamp-2 text-[12px] leading-tight text-[#1c0a0c]/70 sm:text-sm sm:leading-normal">
                {post.description}
              </p>

              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[10px] text-[#1c0a0c]/60 sm:gap-x-4 sm:gap-y-1 sm:text-xs">
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  {t("portal.nComments", { count: post.comment_count ?? 0 })}
                </span>
                {(post.attachment_count ?? 0) > 0 && (
                  <span className="flex items-center gap-1">
                    <Paperclip className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                    {post.attachment_count}
                  </span>
                )}
                {post.created_at && <LocalTime date={post.created_at} relative />}
                {post.tags?.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="outline"
                    // Badge is a fixed h-5/text-xs by default, which after the
                    // meta row dropped to 10px made the tag the tallest thing
                    // in it — so the row height ignored the smaller type until
                    // this came down with it.
                    className="max-sm:h-4 max-sm:px-1.5 max-sm:text-[10px]"
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

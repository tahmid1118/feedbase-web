"use client";

import { useEffect, useState } from "react";
import { ThumbsUp } from "@/components/icons";
import { getGuestId, getVotedSet, setVotedLocal } from "@/lib/portal/guest";

const API_BASE =
  process.env.NEXT_PUBLIC_FEEDBOARD_API_BASE_URL || "http://localhost:4560";

interface PortalVoteButtonProps {
  tenant: string;
  postId: number;
  initialCount: number;
  brand: string;
}

export function PortalVoteButton({
  tenant,
  postId,
  initialCount,
  brand,
}: PortalVoteButtonProps) {
  const [count, setCount] = useState(initialCount);
  const [voted, setVoted] = useState(false);
  const [busy, setBusy] = useState(false);

  // Hydrate the filled state from the local hint (server reconciles on toggle).
  useEffect(() => {
    setVoted(Boolean(getVotedSet(tenant)[postId]));
  }, [tenant, postId]);

  const toggle = async (e: React.MouseEvent) => {
    // Sits above a stretched card link — don't navigate when voting.
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy(true);

    const prevVoted = voted;
    const prevCount = count;
    setVoted(!voted);
    setCount((c) => Math.max(0, c + (voted ? -1 : 1)));

    try {
      const res = await fetch(
        `${API_BASE}/public/${encodeURIComponent(tenant)}/posts/${postId}/vote`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lg: "en", guestId: getGuestId() }),
        }
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.data) throw new Error();
      // Adopt the authoritative state from the server.
      setVoted(json.data.voted);
      setCount(json.data.voteCount);
      setVotedLocal(tenant, postId, json.data.voted);
    } catch {
      setVoted(prevVoted);
      setCount(prevCount);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={voted}
      aria-label={voted ? "Remove vote" : "Upvote"}
      // Smaller on a phone: at a fixed 56px this was the tallest thing in a
      // board card and set the floor on card height, so it capped how many
      // posts fit on screen. 44px still clears the minimum touch target.
      className="group/vote relative z-[2] flex h-11 w-10 shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg border transition-all duration-150 hover:shadow-sm active:scale-90 sm:h-14 sm:w-12"
      style={
        voted
          ? { backgroundColor: brand, borderColor: brand, color: "#fff" }
          : {
              backgroundColor: "#fff",
              borderColor: "rgba(0,0,0,0.08)",
              color: "#1c0a0c",
            }
      }
    >
      <ThumbsUp
        className="h-3.5 w-3.5 transition-transform duration-150 group-hover/vote:scale-125 sm:h-4 sm:w-4"
        style={voted ? { fill: "#fff", color: "#fff" } : { color: brand }}
      />
      <span className="text-[13px] leading-none font-semibold sm:text-sm">{count}</span>
    </button>
  );
}

"use client";

import { useEffect, useState } from "react";
import { ThumbsUp } from "lucide-react";
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
      className="group/vote relative z-[2] flex h-14 w-12 shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg border transition-all duration-150 hover:shadow-sm active:scale-90"
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
        className="h-4 w-4 transition-transform duration-150 group-hover/vote:scale-125"
        style={voted ? { fill: "#fff", color: "#fff" } : { color: brand }}
      />
      <span className="text-sm font-semibold">{count}</span>
    </button>
  );
}

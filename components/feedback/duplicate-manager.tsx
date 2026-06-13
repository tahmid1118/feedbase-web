"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Copy, X, ThumbsUp } from "lucide-react";
import {
  postsApi,
  extractRows,
  type DuplicateSuggestion,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";

interface DuplicateManagerProps {
  postId: number;
  duplicateOfPostId: number | null;
  onChange: () => void;
}

export function DuplicateManager({
  postId,
  duplicateOfPostId,
  onChange,
}: DuplicateManagerProps) {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const [suggestions, setSuggestions] = useState<DuplicateSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const loadSuggestions = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await postsApi.duplicateSuggestions(postId, token);
      setSuggestions(extractRows<DuplicateSuggestion>(res.data, ""));
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSuggestions([]);
  }, [postId]);

  const markDuplicate = async (targetId: number | null) => {
    if (!token) return;
    setBusy(true);
    try {
      await postsApi.markDuplicate(postId, targetId, token);
      toast.success(
        targetId ? "Marked as duplicate" : "Duplicate mark cleared"
      );
      onChange();
    } catch {
      toast.error("Failed to update duplicate status");
    } finally {
      setBusy(false);
    }
  };

  if (duplicateOfPostId) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-2">
        <span className="flex items-center gap-2 text-sm text-amber-800">
          <Copy className="h-4 w-4" />
          Marked as a duplicate of{" "}
          <Link
            href={`/dashboard/feedback/${duplicateOfPostId}`}
            className="font-medium underline"
          >
            post #{duplicateOfPostId}
          </Link>
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="text-amber-800 hover:text-amber-900"
          onClick={() => markDuplicate(null)}
          disabled={busy}
        >
          <X className="h-3.5 w-3.5" />
          Clear
        </Button>
      </div>
    );
  }

  return (
    <Popover onOpenChange={(open) => open && loadSuggestions()}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="text-[#1c0a0c]/70">
          <Copy className="h-4 w-4" />
          Mark duplicate
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-2">
        <p className="px-2 py-1 text-xs font-medium uppercase tracking-wide text-[#1c0a0c]/50">
          Possible duplicates
        </p>
        {loading ? (
          <p className="px-2 py-3 text-center text-sm text-[#1c0a0c]/50">
            Finding suggestions...
          </p>
        ) : suggestions.length === 0 ? (
          <p className="px-2 py-3 text-center text-sm text-[#1c0a0c]/50">
            No likely duplicates found.
          </p>
        ) : (
          <div className="max-h-72 space-y-1 overflow-y-auto">
            {suggestions.map((s) => (
              <button
                key={s.id}
                type="button"
                disabled={busy}
                onClick={() => markDuplicate(s.id)}
                className="flex w-full items-start justify-between gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-[#fdf8f9] disabled:opacity-50"
              >
                <span className="line-clamp-2 text-[#1c0a0c]">{s.title}</span>
                <span className="flex shrink-0 items-center gap-1 text-xs text-[#1c0a0c]/50">
                  <ThumbsUp className="h-3 w-3" />
                  {s.vote_count}
                </span>
              </button>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

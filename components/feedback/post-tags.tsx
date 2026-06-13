"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Check, Plus, X } from "lucide-react";
import { tagsApi, extractRows, type Tag } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";

interface PostTagsProps {
  postId: number;
  initialTags?: Tag[];
  canEdit?: boolean;
}

export function PostTags({ postId, initialTags = [], canEdit = true }: PostTagsProps) {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const [assigned, setAssigned] = useState<Tag[]>(initialTags);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    setAssigned(initialTags);
  }, [initialTags]);

  useEffect(() => {
    tagsApi
      .list(token)
      .then((res) => setAllTags(extractRows<Tag>(res.data, "tags")))
      .catch(() => setAllTags([]));
  }, [token]);

  const isAssigned = (id: number) => assigned.some((t) => t.id === id);

  const toggleTag = async (tag: Tag) => {
    if (!token) return;
    setBusyId(tag.id);
    try {
      if (isAssigned(tag.id)) {
        await tagsApi.removeFromPost(postId, tag.id, token);
        setAssigned((prev) => prev.filter((t) => t.id !== tag.id));
      } else {
        await tagsApi.addToPost(postId, tag.id, token);
        setAssigned((prev) => [...prev, tag]);
      }
    } catch {
      toast.error("Failed to update tags");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {assigned.map((tag) => (
        <Badge
          key={tag.id}
          variant="outline"
          className="gap-1 border-[#e399a3]/40"
          style={
            tag.color_hex
              ? { color: tag.color_hex, borderColor: tag.color_hex }
              : undefined
          }
        >
          {tag.name}
          {canEdit && (
            <button
              type="button"
              onClick={() => toggleTag(tag)}
              className="ml-0.5 hover:opacity-70"
              aria-label={`Remove ${tag.name}`}
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </Badge>
      ))}

      {assigned.length === 0 && !canEdit && (
        <span className="text-sm text-[#1c0a0c]/50">No tags</span>
      )}

      {canEdit && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-6 gap-1 border-dashed border-[#e399a3]/50 text-xs text-[#1c0a0c]/70"
            >
              <Plus className="h-3 w-3" />
              Tag
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-56 p-1">
            {allTags.length === 0 ? (
              <p className="px-2 py-3 text-center text-sm text-[#1c0a0c]/50">
                No tags created yet.
              </p>
            ) : (
              <div className="max-h-64 overflow-y-auto">
                {allTags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    disabled={busyId === tag.id}
                    onClick={() => toggleTag(tag)}
                    className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-[#fdf8f9] disabled:opacity-50"
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: tag.color_hex || "#c74959" }}
                      />
                      {tag.name}
                    </span>
                    {isAssigned(tag.id) && (
                      <Check className="h-4 w-4 text-[#c74959]" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

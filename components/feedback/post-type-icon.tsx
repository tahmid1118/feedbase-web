import { Bug, MessageSquare, Sparkles } from "@/components/icons";
import type { ComponentType } from "react";

import type { PostType } from "@/lib/api";

/**
 * One icon per feedback type, shared by every place the type shows up — submit
 * forms, dashboard dialogs, list filters, board-card badges — so they can't
 * drift into mismatched icon sets across surfaces. Colour/size are left to the
 * caller via className.
 */
export const POST_TYPE_ICON: Record<PostType, ComponentType<{ className?: string }>> = {
  feedback: MessageSquare,
  feature_request: Sparkles,
  bug_report: Bug,
};

export function PostTypeIcon({
  type,
  className = "h-4 w-4",
}: {
  type: PostType;
  className?: string;
}) {
  const Icon = POST_TYPE_ICON[type];
  return <Icon className={className} />;
}

"use client";

import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { CornerDownRight, Loader2, ShieldAlert } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { LocalTime } from "@/components/local-time";
import { VerifiedBadge } from "@/components/portal/verified-badge";
import { useTranslation } from "@/lib/i18n/client";
import { commentsApi, type Comment } from "@/lib/api";
import { toast } from "sonner";

interface CommentNode extends Comment {
  children: CommentNode[];
}

function buildTree(comments: Comment[]): CommentNode[] {
  const map = new Map<number, CommentNode>();
  const roots: CommentNode[] = [];

  comments.forEach((c) => map.set(c.id, { ...c, children: [] }));
  map.forEach((node) => {
    const parentId = node.parent_comment_id;
    if (parentId && map.has(parentId)) {
      map.get(parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

interface CommentThreadProps {
  comments: Comment[];
  /** Post to attach new comments/replies to. */
  postId: number;
  /** Auth token for the current dashboard user (owner/member). */
  token?: string;
  /** Called after a comment/reply is posted so the parent can reload. */
  onPosted?: () => void;
  /** Owner may reply as "Name (Owner)" + tick (Pro+). */
  ownerBadge?: boolean;
  /** Owner may reply as "Owner" only (name hidden) (Business). */
  ownerPrivacy?: boolean;
}

/**
 * Dashboard feedback comment thread. Displays the discussion AND lets the
 * signed-in team member reply directly — the reply is attributed to their
 * account (a platform admin's reply shows a verified tick here and on the public
 * board). Replying here is the reliable, same-origin path: the public portal
 * lives on a tenant subdomain that can't always see the dashboard login.
 */
export function CommentThread({
  comments,
  postId,
  token,
  onPosted,
  ownerBadge,
  ownerPrivacy,
}: CommentThreadProps) {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const isOwner = session?.user?.role === "owner";
  // Replying is free on every plan. A paid plan only adds the identities the
  // reply can carry — a Free owner replies under their own name.
  const tree = useMemo(() => buildTree(comments), [comments]);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // Owners reply as "Name (Owner)" or (Business) hidden "Owner" — no plain-name
  // option once a badge is available.
  const [commentAs, setCommentAs] = useState<"self" | "owner_named" | "owner_hidden">("self");
  const ownerOptions: ("owner_named" | "owner_hidden")[] = [];
  if (ownerBadge) ownerOptions.push("owner_named");
  if (ownerPrivacy) ownerOptions.push("owner_hidden");
  const canPickOwner = isOwner && ownerOptions.length > 0;
  const commentAsEff = ownerOptions.includes(commentAs as "owner_named" | "owner_hidden")
    ? commentAs
    : ownerOptions[0] ?? "self";

  /**
   * Restore a comment the spam filter quarantined.
   *
   * Quarantined comments are hidden from the PUBLIC board but still rendered
   * here, badged — otherwise a false positive would be suppressed with nothing
   * to see and no way back, which is a worse failure than the spam it stopped.
   */
  const restoreComment = async (commentId: number) => {
    if (!token) return;
    try {
      await commentsApi.updateModeration(commentId, "published", token);
      toast.success(t("comments.restoredFromSpam"));
      onPosted?.(); // reuse the thread's refresh path
    } catch {
      toast.error(t("comments.restoreFailed"));
    }
  };

  const post = async (text: string, parentCommentId: number | null) => {
    if (!text.trim() || !token) return false;
    setSubmitting(true);
    try {
      const ownerMode =
        canPickOwner && commentAsEff === "owner_named" && ownerBadge
          ? "named"
          : canPickOwner && commentAsEff === "owner_hidden" && ownerPrivacy
            ? "hidden"
            : undefined;
      await commentsApi.create(
        {
          postId,
          body: text.trim(),
          parentCommentId: parentCommentId ?? undefined,
          ownerMode,
        },
        token
      );
      onPosted?.();
      return true;
    } catch {
      toast.error(t("comments.postFailed"));
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top-level composer — available on every plan. */}
      <div className="space-y-2">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t("comments.addComment")}
          className="min-h-[80px]"
        />
        <div className="flex items-center justify-end gap-2">
          {canPickOwner && (
            <label className="flex items-center gap-1.5 text-xs text-[#1c0a0c]/50">
              {t("comments.commentingAs")}
              {ownerOptions.length > 1 ? (
                <select
                  value={commentAsEff}
                  onChange={(e) =>
                    setCommentAs(e.target.value as "owner_named" | "owner_hidden")
                  }
                  className="rounded-md border border-[#e399a3]/50 bg-white px-1.5 py-0.5 font-medium text-[#1c0a0c]/70 outline-none focus:ring-1 focus:ring-[#c74959]/40"
                >
                  {ownerOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt === "owner_named"
                        ? `${session?.user?.name || t("comments.asYourName")} (${t("comments.owner")})`
                        : t("comments.owner")}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="font-medium text-[#1c0a0c]/70">
                  {commentAsEff === "owner_hidden"
                    ? t("comments.owner")
                    : `${session?.user?.name || t("comments.asYourName")} (${t("comments.owner")})`}
                </span>
              )}
            </label>
          )}
          <Button
            size="sm"
            disabled={submitting || !body.trim()}
            onClick={async () => {
              if (await post(body, null)) setBody("");
            }}
            className="bg-[#c74959] text-white hover:bg-[#b03f4d]"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              t("comments.comment")
            )}
          </Button>
        </div>
      </div>

      {comments.length === 0 ? (
        <p className="py-8 text-center text-sm text-[#1c0a0c]/60">
          {t("comments.none")}
        </p>
      ) : (
        <div className="space-y-3">
          {tree.map((node) => (
            <CommentItem
              key={node.id}
              node={node}
              depth={0}
              submitting={submitting}
              onReply={post}
              onRestore={isOwner ? restoreComment : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CommentItem({
  node,
  depth,
  submitting,
  onReply,
  canReply = true,
  onRestore,
}: {
  node: CommentNode;
  depth: number;
  submitting: boolean;
  onReply: (text: string, parentId: number | null) => Promise<boolean>;
  canReply?: boolean;
  /** Owner-only; absent for members, who can see the badge but not act on it. */
  onRestore?: (commentId: number) => void | Promise<void>;
}) {
  const { t } = useTranslation();
  const [replying, setReplying] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const quarantined = node.moderation_state === "spam";

  return (
    <div className={depth > 0 ? "ml-6 border-l border-[#e399a3]/30 pl-4" : ""}>
      {/* A quarantined comment is deliberately still shown to the team, tinted
          and labelled, rather than filtered out — an invisible suppression is
          impossible to notice, let alone correct. */}
      <div
        className={
          quarantined
            ? "rounded-lg border border-red-200 bg-red-50/60 p-4"
            : "rounded-lg border border-[#e399a3]/20 bg-[#fdf8f9] p-4"
        }
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-medium text-[#1c0a0c]">
              {node.author_as_owner === 2
                ? t("comments.owner")
                : node.author_as_owner === 1
                  ? `${node.author_name} (${t("comments.owner")})`
                  : node.author_name}
            </span>
            {node.author_as_owner ? (
              <VerifiedBadge label={t("comments.verifiedOwner")} />
            ) : node.author_is_admin ? (
              <VerifiedBadge />
            ) : null}
            {node.is_edited === 1 && (
              <Badge variant="outline" className="text-xs">
                {t("comments.edited")}
              </Badge>
            )}
          </div>
          <span className="text-xs text-[#1c0a0c]/50">
            {node.created_at ? (
              <LocalTime date={node.created_at} />
            ) : (
              t("portal.recently")
            )}
          </span>
        </div>

        {quarantined && (
          <div className="mt-2 flex flex-wrap items-center gap-2 rounded-md bg-red-100/70 px-2.5 py-1.5">
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-700">
              <ShieldAlert className="h-3 w-3" />
              {t("comments.hiddenAsSpam")}
            </span>
            {onRestore && (
              <button
                type="button"
                onClick={() => onRestore(node.id)}
                className="text-[11px] font-semibold text-red-700 underline underline-offset-2 hover:text-red-900"
              >
                {t("feedback.notSpam")}
              </button>
            )}
          </div>
        )}

        <p className="mt-2 whitespace-pre-wrap text-sm text-[#1c0a0c]/80">
          {node.body}
        </p>

        {canReply && (
          <button
            type="button"
            onClick={() => setReplying((v) => !v)}
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[#1c0a0c]/50 hover:text-[#c74959]"
          >
            <CornerDownRight className="h-3 w-3" />
            {t("comments.reply")}
          </button>
        )}

        {canReply && replying && (
          <div className="mt-2 space-y-2">
            <Textarea
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              placeholder={t("comments.writeReply")}
              className="min-h-[70px]"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setReplying(false);
                  setReplyBody("");
                }}
              >
                {t("common.cancel")}
              </Button>
              <Button
                size="sm"
                disabled={submitting || !replyBody.trim()}
                onClick={async () => {
                  if (await onReply(replyBody, node.id)) {
                    setReplyBody("");
                    setReplying(false);
                  }
                }}
                className="bg-[#c74959] text-white hover:bg-[#b03f4d]"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t("comments.reply")
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      {node.children.length > 0 && (
        <div className="mt-3 space-y-3">
          {node.children.map((child) => (
            <CommentItem
              key={child.id}
              node={child}
              depth={depth + 1}
              submitting={submitting}
              onReply={onReply}
              canReply={canReply}
              // Threaded through, or a quarantined REPLY would show the badge
              // with no way to act on it.
              onRestore={onRestore}
            />
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { CornerDownRight, Loader2 } from "lucide-react";
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
}: CommentThreadProps) {
  const { t } = useTranslation();
  const tree = useMemo(() => buildTree(comments), [comments]);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const post = async (text: string, parentCommentId: number | null) => {
    if (!text.trim() || !token) return false;
    setSubmitting(true);
    try {
      await commentsApi.create(
        { postId, body: text.trim(), parentCommentId: parentCommentId ?? undefined },
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
      {/* Top-level composer */}
      <div className="space-y-2">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t("comments.addComment")}
          className="min-h-[80px]"
        />
        <div className="flex justify-end">
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
}: {
  node: CommentNode;
  depth: number;
  submitting: boolean;
  onReply: (text: string, parentId: number | null) => Promise<boolean>;
}) {
  const { t } = useTranslation();
  const [replying, setReplying] = useState(false);
  const [replyBody, setReplyBody] = useState("");

  return (
    <div className={depth > 0 ? "ml-6 border-l border-[#e399a3]/30 pl-4" : ""}>
      <div className="rounded-lg border border-[#e399a3]/20 bg-[#fdf8f9] p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-medium text-[#1c0a0c]">{node.author_name}</span>
            {node.author_is_admin ? <VerifiedBadge /> : null}
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

        <p className="mt-2 whitespace-pre-wrap text-sm text-[#1c0a0c]/80">
          {node.body}
        </p>

        <button
          type="button"
          onClick={() => setReplying((v) => !v)}
          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[#1c0a0c]/50 hover:text-[#c74959]"
        >
          <CornerDownRight className="h-3 w-3" />
          {t("comments.reply")}
        </button>

        {replying && (
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
            />
          ))}
        </div>
      )}
    </div>
  );
}

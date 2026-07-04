"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CornerDownRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LocalTime } from "@/components/local-time";
import type { Comment } from "@/lib/api/types";

const API_BASE =
  process.env.NEXT_PUBLIC_FEEDBASE_API_BASE_URL || "http://localhost:4560";

const NAME_KEY = "fb_guest_name";
const EMAIL_KEY = "fb_guest_email";
const COMMENTED_KEY = "fb_has_commented";
const readLocal = (k: string) => {
  try {
    return (typeof localStorage !== "undefined" && localStorage.getItem(k)) || "";
  } catch {
    return "";
  }
};
const writeLocal = (k: string, v: string) => {
  try {
    localStorage.setItem(k, v);
  } catch {
    /* ignore */
  }
};

interface Thread {
  root: Comment;
  replies: Comment[];
}

// Flatten the comments to two levels: each top-level comment plus a single flat
// list of every reply beneath it (in time order), no matter how deep the stored
// parent chain goes. Replies never start their own nested thread.
function buildThreads(comments: Comment[]): Thread[] {
  const byId = new Map<number, Comment>();
  comments.forEach((c) => byId.set(c.id, c));

  const isRoot = (c: Comment) =>
    !c.parent_comment_id || !byId.has(c.parent_comment_id);

  const rootIdOf = (c: Comment): number => {
    let cur = c;
    const seen = new Set<number>();
    while (!isRoot(cur) && !seen.has(cur.id)) {
      seen.add(cur.id);
      cur = byId.get(cur.parent_comment_id!)!;
    }
    return cur.id;
  };

  const threads = new Map<number, Thread>();
  const order: number[] = [];
  // The API returns comments in created_at ASC order, so roots and replies come
  // out chronological.
  comments.forEach((c) => {
    if (isRoot(c) && !threads.has(c.id)) {
      threads.set(c.id, { root: c, replies: [] });
      order.push(c.id);
    }
  });
  comments.forEach((c) => {
    if (!isRoot(c)) threads.get(rootIdOf(c))?.replies.push(c);
  });

  return order.map((id) => threads.get(id)!);
}

type Submit = (
  body: string,
  parentId: number | null,
  name: string,
  email: string
) => Promise<boolean>;

function CommentForm({
  brand,
  submitting,
  onSubmit,
  onCancel,
  compact,
  autoFocus,
}: {
  brand: string;
  submitting: boolean;
  onSubmit: (body: string, name: string, email: string) => Promise<boolean>;
  onCancel?: () => void;
  compact?: boolean;
  autoFocus?: boolean;
}) {
  const [body, setBody] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  // Show the name/email inputs only until the visitor has commented once; after
  // that we remember them and just show "Commenting as …" (with a Change link).
  const [editingIdentity, setEditingIdentity] = useState(false);

  // Hydrate the remembered identity (client-only storage, so it must run in an
  // effect to avoid a hydration mismatch — once, no perf concern).
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setName(readLocal(NAME_KEY));
    setEmail(readLocal(EMAIL_KEY));
    setEditingIdentity(readLocal(COMMENTED_KEY) !== "1");
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const handle = async () => {
    if (!body.trim()) return;
    writeLocal(NAME_KEY, name.trim());
    writeLocal(EMAIL_KEY, email.trim());
    const ok = await onSubmit(body.trim(), name.trim(), email.trim());
    if (ok) {
      writeLocal(COMMENTED_KEY, "1"); // remember — don't ask for identity again
      setBody("");
      setEditingIdentity(false);
    }
  };

  return (
    <div className="space-y-2">
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={compact ? "Write a reply…" : "Add a comment…"}
        className="min-h-[80px]"
        autoFocus={autoFocus}
      />

      {editingIdentity && (
        <div className="flex flex-wrap gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name (optional)"
            className="h-9 w-40"
          />
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="Email (optional)"
            className="h-9 w-52"
          />
        </div>
      )}

      <div className="flex items-center gap-2">
        {!editingIdentity && (
          <p className="text-xs text-[#1c0a0c]/50">
            Commenting as{" "}
            <span className="font-medium text-[#1c0a0c]/70">
              {name || "Anonymous"}
            </span>
          </p>
        )}
        <div className="ml-auto flex gap-2">
          {onCancel && (
            <Button variant="outline" size="sm" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button
            size="sm"
            onClick={handle}
            disabled={submitting || !body.trim()}
            className="text-white hover:opacity-90"
            style={{ backgroundColor: brand }}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : compact ? (
              "Reply"
            ) : (
              "Comment"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function CommentCard({
  comment,
  onReply,
}: {
  comment: Comment;
  onReply: () => void;
}) {
  return (
    <div className="rounded-lg border border-black/5 bg-[#fdf8f9] p-4">
      <div className="flex items-center justify-between">
        <span className="font-medium text-[#1c0a0c]">{comment.author_name}</span>
        <LocalTime
          date={comment.created_at}
          relative
          className="text-xs text-[#1c0a0c]/50"
        />
      </div>
      <p className="mt-2 text-sm text-[#1c0a0c]/80">{comment.body}</p>
      <button
        type="button"
        onClick={onReply}
        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[#1c0a0c]/50 hover:text-[#1c0a0c]"
      >
        <CornerDownRight className="h-3 w-3" />
        Reply
      </button>
    </div>
  );
}

function ThreadView({
  thread,
  brand,
  submitting,
  replyTo,
  setReplyTo,
  submit,
}: {
  thread: Thread;
  brand: string;
  submitting: boolean;
  replyTo: number | null;
  setReplyTo: (id: number | null) => void;
  submit: Submit;
}) {
  const { root, replies } = thread;
  const isReplying = replyTo === root.id;

  // Every "Reply" in the thread (on the root or any reply) targets the root, so
  // the thread stays a single flat level.
  return (
    <div>
      <CommentCard
        comment={root}
        onReply={() => setReplyTo(isReplying ? null : root.id)}
      />
      {(replies.length > 0 || isReplying) && (
        <div className="mt-3 ml-6 space-y-3 border-l border-black/10 pl-4">
          {replies.map((reply) => (
            <CommentCard
              key={reply.id}
              comment={reply}
              onReply={() => setReplyTo(root.id)}
            />
          ))}
          {isReplying && (
            <CommentForm
              brand={brand}
              submitting={submitting}
              compact
              autoFocus
              onCancel={() => setReplyTo(null)}
              onSubmit={(body, name, email) => submit(body, root.id, name, email)}
            />
          )}
        </div>
      )}
    </div>
  );
}

export function PortalComments({
  tenant,
  postId,
  comments,
  brand,
}: {
  tenant: string;
  postId: number;
  comments: Comment[];
  brand: string;
}) {
  const router = useRouter();
  const threads = useMemo(() => buildThreads(comments), [comments]);
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit: Submit = async (body, parentId, name, email) => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_BASE}/public/${encodeURIComponent(tenant)}/posts/${postId}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lg: "en",
            body,
            parentCommentId: parentId ?? undefined,
            submitterName: name || undefined,
            submitterEmail: email || undefined,
          }),
        }
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json?.message || "Failed to post comment.");
        return false;
      }
      setReplyTo(null);
      router.refresh(); // re-fetch the post + comments
      return true;
    } catch {
      setError("Unable to reach the server. Please try again.");
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <CommentForm
        brand={brand}
        submitting={submitting}
        onSubmit={(body, name, email) => submit(body, null, name, email)}
      />

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      {threads.length === 0 ? (
        <p className="py-6 text-center text-sm text-[#1c0a0c]/60">
          No comments yet — start the conversation.
        </p>
      ) : (
        <div className="space-y-3">
          {threads.map((thread) => (
            <ThreadView
              key={thread.root.id}
              thread={thread}
              brand={brand}
              submitting={submitting}
              replyTo={replyTo}
              setReplyTo={setReplyTo}
              submit={submit}
            />
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { CornerDownRight, Loader2, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LocalTime } from "@/components/local-time";
import { portalActions } from "@/lib/portal/actions";
import { getGuestId } from "@/lib/portal/guest";
import { guestIdentity, colorFor } from "@/lib/portal/anon-identity";
import { resolveUploadUrl } from "@/lib/avatar";
import type { Comment } from "@/lib/api/types";

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

interface Viewer {
  token?: string;
  userId: number | null;
  name: string | null;
  image: string | null;
  isLoggedIn: boolean;
}

function Avatar({
  name,
  src,
  size = 28,
  color = "#c74959",
}: {
  name: string;
  src?: string | null;
  size?: number;
  color?: string;
}) {
  const url = resolveUploadUrl(src);
  const dims = { width: size, height: size };
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={name}
        className="shrink-0 rounded-full object-cover"
        style={dims}
      />
    );
  }
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{ ...dims, fontSize: size * 0.42, backgroundColor: color }}
    >
      {(name || "?").charAt(0).toUpperCase()}
    </span>
  );
}

interface Display {
  name: string;
  avatar: string | null;
  color: string;
}

/**
 * Resolve how a comment's author is shown:
 *  - logged-in user  → real name + avatar (colour keyed off their identity)
 *  - guest w/ a name → the name they gave + a stable colour
 *  - anonymous guest → a stable friendly pseudonym + colour (keyed off guest_id
 *    so all of one guest's comments match; falls back to the comment id for
 *    older rows that predate guest_id capture)
 */
function commentDisplay(comment: Comment): Display {
  if (comment.author_id != null) {
    return {
      name: comment.author_name,
      avatar: comment.author_avatar ?? null,
      color: colorFor(comment.author_name || String(comment.author_id)),
    };
  }
  if (comment.author_name && comment.author_name !== "Anonymous") {
    return {
      name: comment.author_name,
      avatar: null,
      color: colorFor(comment.guest_id || comment.author_name),
    };
  }
  const id = guestIdentity(comment.guest_id || `c${comment.id}`);
  return { name: id.name, avatar: null, color: id.color };
}

interface Thread {
  root: Comment;
  replies: Comment[];
}

// Flatten the comments to two levels: each top-level comment plus a single flat
// list of every reply beneath it (in time order), no matter how deep the stored
// parent chain goes.
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

type Submit = (body: string, parentId: number | null) => Promise<boolean>;

function CommentForm({
  brand,
  viewer,
  submitting,
  onSubmit,
  onCancel,
  compact,
  autoFocus,
}: {
  brand: string;
  viewer: Viewer;
  submitting: boolean;
  onSubmit: (body: string, name: string, email: string) => Promise<boolean>;
  onCancel?: () => void;
  compact?: boolean;
  autoFocus?: boolean;
}) {
  const [body, setBody] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  // Guests: show the name/email inputs only until they've commented once.
  const [editingIdentity, setEditingIdentity] = useState(false);
  // The guest's own stable pseudonym (client-only: keyed off the guest cookie).
  const [guestId, setGuestId] = useState("");

  useEffect(() => {
    if (viewer.isLoggedIn) return;
    /* eslint-disable react-hooks/set-state-in-effect */
    setName(readLocal(NAME_KEY));
    setEmail(readLocal(EMAIL_KEY));
    setEditingIdentity(readLocal(COMMENTED_KEY) !== "1");
    setGuestId(getGuestId());
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [viewer.isLoggedIn]);

  const guestPseudonym = guestId ? guestIdentity(guestId) : null;

  const handle = async () => {
    if (!body.trim()) return;
    if (!viewer.isLoggedIn) {
      writeLocal(NAME_KEY, name.trim());
      writeLocal(EMAIL_KEY, email.trim());
    }
    const ok = await onSubmit(body.trim(), name.trim(), email.trim());
    if (ok) {
      if (!viewer.isLoggedIn) {
        writeLocal(COMMENTED_KEY, "1");
        setEditingIdentity(false);
      }
      setBody("");
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

      {!viewer.isLoggedIn && editingIdentity && (
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
        {viewer.isLoggedIn ? (
          <p className="flex items-center gap-1.5 text-xs text-[#1c0a0c]/50">
            <Avatar
              name={viewer.name || "You"}
              src={viewer.image}
              color={colorFor(viewer.name || "you")}
              size={20}
            />
            Commenting as{" "}
            <span className="font-medium text-[#1c0a0c]/70">{viewer.name}</span>
          </p>
        ) : (
          !editingIdentity &&
          (() => {
            const label = name || guestPseudonym?.name || "Anonymous";
            const color = name
              ? colorFor(guestId || name)
              : guestPseudonym?.color || "#c74959";
            return (
              <p className="flex items-center gap-1.5 text-xs text-[#1c0a0c]/50">
                <Avatar name={label} color={color} size={20} />
                Commenting as{" "}
                <span className="font-medium text-[#1c0a0c]/70">{label}</span>
              </p>
            );
          })()
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
  viewer,
  tenant,
  onReply,
  onChanged,
}: {
  comment: Comment;
  viewer: Viewer;
  tenant: string;
  onReply: () => void;
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState(comment.body);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  const mine =
    viewer.isLoggedIn &&
    comment.author_id != null &&
    Number(comment.author_id) === viewer.userId;

  const display = commentDisplay(comment);

  const saveEdit = async () => {
    if (!editBody.trim() || !viewer.token) return;
    setBusy(true);
    const res = await portalActions.editComment(
      tenant,
      comment.id,
      editBody.trim(),
      viewer.token
    );
    setBusy(false);
    if (res.ok) {
      setEditing(false);
      onChanged();
    }
  };

  const remove = async () => {
    if (!viewer.token) return;
    setBusy(true);
    const res = await portalActions.deleteComment(tenant, comment.id, viewer.token);
    setBusy(false);
    if (res.ok) onChanged();
  };

  return (
    <div className="rounded-lg border border-black/5 bg-[#fdf8f9] p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Avatar
            name={display.name}
            src={display.avatar}
            color={display.color}
            size={24}
          />
          <span className="font-medium text-[#1c0a0c]">{display.name}</span>
          {comment.is_edited ? (
            <span className="text-xs text-[#1c0a0c]/40">(edited)</span>
          ) : null}
        </div>
        <LocalTime
          date={comment.created_at}
          relative
          className="shrink-0 text-xs text-[#1c0a0c]/50"
        />
      </div>

      {editing ? (
        <div className="mt-2 space-y-2">
          <Textarea
            value={editBody}
            onChange={(e) => setEditBody(e.target.value)}
            className="min-h-[70px]"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditing(false);
                setEditBody(comment.body);
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={saveEdit}
              disabled={busy || !editBody.trim()}
              className="bg-[#c74959] text-white hover:bg-[#b03f4d]"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </div>
        </div>
      ) : (
        <p className="mt-2 whitespace-pre-wrap text-sm text-[#1c0a0c]/80">
          {comment.body}
        </p>
      )}

      {!editing && (
        <div className="mt-2 flex items-center gap-3 text-xs font-medium text-[#1c0a0c]/50">
          <button
            type="button"
            onClick={onReply}
            className="inline-flex items-center gap-1 hover:text-[#1c0a0c]"
          >
            <CornerDownRight className="h-3 w-3" />
            Reply
          </button>
          {mine && !confirmDelete && (
            <>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-1 hover:text-[#1c0a0c]"
              >
                <Pencil className="h-3 w-3" />
                Edit
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="inline-flex items-center gap-1 hover:text-red-600"
              >
                <Trash2 className="h-3 w-3" />
                Delete
              </button>
            </>
          )}
          {mine && confirmDelete && (
            <span className="inline-flex items-center gap-2 text-red-600">
              Delete this comment?
              <button
                type="button"
                onClick={remove}
                disabled={busy}
                className="font-semibold underline"
              >
                {busy ? "Deleting…" : "Yes"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="text-[#1c0a0c]/50 underline"
              >
                No
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function ThreadView({
  thread,
  brand,
  viewer,
  tenant,
  submitting,
  replyTo,
  setReplyTo,
  submit,
  onChanged,
}: {
  thread: Thread;
  brand: string;
  viewer: Viewer;
  tenant: string;
  submitting: boolean;
  replyTo: number | null;
  setReplyTo: (id: number | null) => void;
  submit: Submit;
  onChanged: () => void;
}) {
  const { root, replies } = thread;
  const isReplying = replyTo === root.id;

  return (
    <div>
      <CommentCard
        comment={root}
        viewer={viewer}
        tenant={tenant}
        onReply={() => setReplyTo(isReplying ? null : root.id)}
        onChanged={onChanged}
      />
      {(replies.length > 0 || isReplying) && (
        <div className="mt-3 ml-6 space-y-3 border-l border-black/10 pl-4">
          {replies.map((reply) => (
            <CommentCard
              key={reply.id}
              comment={reply}
              viewer={viewer}
              tenant={tenant}
              onReply={() => setReplyTo(root.id)}
              onChanged={onChanged}
            />
          ))}
          {isReplying && (
            <CommentForm
              brand={brand}
              viewer={viewer}
              submitting={submitting}
              compact
              autoFocus
              onCancel={() => setReplyTo(null)}
              onSubmit={(body) => submit(body, root.id)}
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
  const { data: session } = useSession();
  const threads = useMemo(() => buildThreads(comments), [comments]);
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const viewer: Viewer = useMemo(() => {
    const token = session?.user?.accessToken || undefined;
    const userId = session?.user?.id ? Number(session.user.id) : null;
    return {
      token,
      userId,
      name: session?.user?.name ?? null,
      image: session?.user?.image ?? null,
      isLoggedIn: Boolean(token && userId),
    };
  }, [session]);

  const onChanged = () => router.refresh();

  // name/email are ignored by the backend when a token is sent (logged-in).
  const submit: Submit = async (body, parentId) => {
    setSubmitting(true);
    setError(null);
    const res = await portalActions.createComment(
      tenant,
      postId,
      {
        body,
        parentCommentId: parentId ?? undefined,
        submitterName: viewer.isLoggedIn ? undefined : readLocal(NAME_KEY) || undefined,
        submitterEmail: viewer.isLoggedIn ? undefined : readLocal(EMAIL_KEY) || undefined,
        guestId: viewer.isLoggedIn ? undefined : getGuestId() || undefined,
      },
      viewer.token
    );
    setSubmitting(false);
    if (!res.ok) {
      setError(res.message || "Failed to post comment.");
      return false;
    }
    setReplyTo(null);
    router.refresh();
    return true;
  };

  return (
    <div className="space-y-5">
      <CommentForm
        brand={brand}
        viewer={viewer}
        submitting={submitting}
        onSubmit={(body) => submit(body, null)}
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
              viewer={viewer}
              tenant={tenant}
              submitting={submitting}
              replyTo={replyTo}
              setReplyTo={setReplyTo}
              submit={submit}
              onChanged={onChanged}
            />
          ))}
        </div>
      )}
    </div>
  );
}

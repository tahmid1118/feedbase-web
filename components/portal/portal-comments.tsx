"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CornerDownRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Comment } from "@/lib/api/types";

const API_BASE =
  process.env.NEXT_PUBLIC_FEEDBASE_API_BASE_URL || "http://localhost:4560";

const NAME_KEY = "fb_guest_name";
const EMAIL_KEY = "fb_guest_email";
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

interface Node extends Comment {
  children: Node[];
}

function buildTree(comments: Comment[]): Node[] {
  const map = new Map<number, Node>();
  const roots: Node[] = [];
  comments.forEach((c) => map.set(c.id, { ...c, children: [] }));
  map.forEach((node) => {
    const parentId = node.parent_comment_id;
    if (parentId && map.has(parentId)) map.get(parentId)!.children.push(node);
    else roots.push(node);
  });
  return roots;
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

  // Pre-fill from a previous comment (client-only storage, so it must be an
  // effect to avoid a hydration mismatch — runs once, no perf concern).
  useEffect(() => {
    const savedName = readLocal(NAME_KEY);
    const savedEmail = readLocal(EMAIL_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (savedName) setName(savedName);
    if (savedEmail) setEmail(savedEmail);
  }, []);

  const handle = async () => {
    if (!body.trim()) return;
    const ok = await onSubmit(body.trim(), name.trim(), email.trim());
    if (ok) setBody("");
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
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            writeLocal(NAME_KEY, e.target.value);
          }}
          placeholder="Name (optional)"
          className="h-9 w-40"
        />
        {!compact && (
          <Input
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              writeLocal(EMAIL_KEY, e.target.value);
            }}
            type="email"
            placeholder="Email (optional)"
            className="h-9 w-52"
          />
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

function CommentItem({
  node,
  depth,
  brand,
  submitting,
  replyTo,
  setReplyTo,
  submit,
}: {
  node: Node;
  depth: number;
  brand: string;
  submitting: boolean;
  replyTo: number | null;
  setReplyTo: (id: number | null) => void;
  submit: Submit;
}) {
  return (
    <div className={depth > 0 ? "ml-6 border-l border-black/10 pl-4" : ""}>
      <div className="rounded-lg border border-black/5 bg-[#fdf8f9] p-4">
        <div className="flex items-center justify-between">
          <span className="font-medium text-[#1c0a0c]">{node.author_name}</span>
          <span className="text-xs text-[#1c0a0c]/50">
            {node.created_at ? new Date(node.created_at).toLocaleDateString() : ""}
          </span>
        </div>
        <p className="mt-2 text-sm text-[#1c0a0c]/80">{node.body}</p>
        <button
          type="button"
          onClick={() => setReplyTo(replyTo === node.id ? null : node.id)}
          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[#1c0a0c]/50 hover:text-[#1c0a0c]"
        >
          <CornerDownRight className="h-3 w-3" />
          Reply
        </button>
      </div>

      {replyTo === node.id && (
        <div className="mt-3 ml-6">
          <CommentForm
            brand={brand}
            submitting={submitting}
            compact
            autoFocus
            onCancel={() => setReplyTo(null)}
            onSubmit={(body, name, email) => submit(body, node.id, name, email)}
          />
        </div>
      )}

      {node.children.length > 0 && (
        <div className="mt-3 space-y-3">
          {node.children.map((child) => (
            <CommentItem
              key={child.id}
              node={child}
              depth={depth + 1}
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
  const tree = useMemo(() => buildTree(comments), [comments]);
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

      {tree.length === 0 ? (
        <p className="py-6 text-center text-sm text-[#1c0a0c]/60">
          No comments yet — start the conversation.
        </p>
      ) : (
        <div className="space-y-3">
          {tree.map((node) => (
            <CommentItem
              key={node.id}
              node={node}
              depth={0}
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

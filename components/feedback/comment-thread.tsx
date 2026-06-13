"use client";

import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { Pencil, Reply, Trash2 } from "lucide-react";
import { commentsApi, type Comment } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
  postId: number;
  comments: Comment[];
  onChange: () => void;
}

export function CommentThread({ postId, comments, onChange }: CommentThreadProps) {
  const { data: session } = useSession();
  const currentUserId = session?.user?.userId;
  const token = session?.user?.accessToken;
  const tree = useMemo(() => buildTree(comments), [comments]);

  if (comments.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-[#1c0a0c]/60">
        No comments yet. Be the first to comment!
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {tree.map((node) => (
        <CommentItem
          key={node.id}
          node={node}
          postId={postId}
          depth={0}
          currentUserId={currentUserId}
          token={token}
          onChange={onChange}
        />
      ))}
    </div>
  );
}

interface CommentItemProps {
  node: CommentNode;
  postId: number;
  depth: number;
  currentUserId?: string;
  token?: string;
  onChange: () => void;
}

function CommentItem({
  node,
  postId,
  depth,
  currentUserId,
  token,
  onChange,
}: CommentItemProps) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editText, setEditText] = useState(node.body);
  const [busy, setBusy] = useState(false);

  const isAuthor =
    currentUserId != null && String(node.author_id) === String(currentUserId);

  const submitReply = async () => {
    if (!token || !replyText.trim()) return;
    setBusy(true);
    try {
      await commentsApi.create(
        { postId, body: replyText.trim(), parentCommentId: node.id },
        token
      );
      setReplyText("");
      setReplyOpen(false);
      onChange();
      toast.success("Reply posted");
    } catch {
      toast.error("Failed to post reply");
    } finally {
      setBusy(false);
    }
  };

  const submitEdit = async () => {
    if (!token || !editText.trim()) return;
    setBusy(true);
    try {
      await commentsApi.update(node.id, editText.trim(), token);
      setEditOpen(false);
      onChange();
      toast.success("Comment updated");
    } catch {
      toast.error("Failed to update comment");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!token) return;
    try {
      await commentsApi.delete(node.id, token);
      onChange();
      toast.success("Comment deleted");
    } catch {
      toast.error("Failed to delete comment");
    }
  };

  return (
    <div className={depth > 0 ? "ml-6 border-l border-[#e399a3]/30 pl-4" : ""}>
      <div className="rounded-lg border border-[#e399a3]/20 bg-[#fdf8f9] p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-medium text-[#1c0a0c]">{node.author_name}</span>
            {node.is_edited === 1 && (
              <Badge variant="outline" className="text-xs">
                Edited
              </Badge>
            )}
          </div>
          <span className="text-xs text-[#1c0a0c]/50">
            {node.created_at
              ? new Date(node.created_at).toLocaleString()
              : "Recently"}
          </span>
        </div>

        {editOpen ? (
          <div className="mt-2 space-y-2">
            <Textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="min-h-[70px]"
            />
            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditOpen(false);
                  setEditText(node.body);
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-[#c74959] text-white hover:bg-[#b03f4d]"
                onClick={submitEdit}
                disabled={busy || !editText.trim()}
              >
                Save
              </Button>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-[#1c0a0c]/80">{node.body}</p>
        )}

        {!editOpen && (
          <div className="mt-2 flex items-center gap-3 text-xs">
            <button
              type="button"
              onClick={() => setReplyOpen((o) => !o)}
              className="flex items-center gap-1 text-[#1c0a0c]/60 hover:text-[#c74959]"
            >
              <Reply className="h-3 w-3" />
              Reply
            </button>
            {isAuthor && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setEditText(node.body);
                    setEditOpen(true);
                  }}
                  className="flex items-center gap-1 text-[#1c0a0c]/60 hover:text-[#c74959]"
                >
                  <Pencil className="h-3 w-3" />
                  Edit
                </button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      type="button"
                      className="flex items-center gap-1 text-[#1c0a0c]/60 hover:text-red-600"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete comment?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently remove the comment and its replies.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        variant="destructive"
                        onClick={handleDelete}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        )}

        {replyOpen && (
          <div className="mt-3 space-y-2">
            <Textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write a reply..."
              className="min-h-[70px]"
            />
            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setReplyOpen(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-[#c74959] text-white hover:bg-[#b03f4d]"
                onClick={submitReply}
                disabled={busy || !replyText.trim()}
              >
                Reply
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
              postId={postId}
              depth={depth + 1}
              currentUserId={currentUserId}
              token={token}
              onChange={onChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}

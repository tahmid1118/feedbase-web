"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import type { Comment } from "@/lib/api";

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
}

/**
 * Read-only comment thread for the dashboard feedback detail. Commenting,
 * replying, and editing all happen on the public board — the dashboard only
 * displays the discussion for triage.
 */
export function CommentThread({ comments }: CommentThreadProps) {
  const tree = useMemo(() => buildTree(comments), [comments]);

  if (comments.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-[#1c0a0c]/60">
        No comments yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {tree.map((node) => (
        <CommentItem key={node.id} node={node} depth={0} />
      ))}
    </div>
  );
}

function CommentItem({ node, depth }: { node: CommentNode; depth: number }) {
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

        <p className="mt-2 whitespace-pre-wrap text-sm text-[#1c0a0c]/80">
          {node.body}
        </p>
      </div>

      {node.children.length > 0 && (
        <div className="mt-3 space-y-3">
          {node.children.map((child) => (
            <CommentItem key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

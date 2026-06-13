import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ThumbsUp, MessageSquare, Calendar } from "lucide-react";
import { publicApi } from "@/lib/api/public";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Comment } from "@/lib/api/types";

const STATUS_BADGE: Record<string, string> = {
  open: "bg-blue-100 text-blue-700",
  planned: "bg-purple-100 text-purple-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  completed: "bg-green-100 text-green-700",
  closed: "bg-gray-100 text-gray-700",
};

interface CommentNode extends Comment {
  children: CommentNode[];
}

function buildTree(comments: Comment[]): CommentNode[] {
  const map = new Map<number, CommentNode>();
  const roots: CommentNode[] = [];
  comments.forEach((c) => map.set(c.id, { ...c, children: [] }));
  map.forEach((node) => {
    const parentId = node.parent_comment_id;
    if (parentId && map.has(parentId)) map.get(parentId)!.children.push(node);
    else roots.push(node);
  });
  return roots;
}

function CommentBranch({ node, depth }: { node: CommentNode; depth: number }) {
  return (
    <div className={depth > 0 ? "ml-6 border-l border-black/10 pl-4" : ""}>
      <div className="rounded-lg border border-black/5 bg-[#fdf8f9] p-4">
        <div className="flex items-center justify-between">
          <span className="font-medium text-[#1c0a0c]">{node.author_name}</span>
          <span className="text-xs text-[#1c0a0c]/50">
            {node.created_at
              ? new Date(node.created_at).toLocaleDateString()
              : ""}
          </span>
        </div>
        <p className="mt-2 text-sm text-[#1c0a0c]/80">{node.body}</p>
      </div>
      {node.children.length > 0 && (
        <div className="mt-3 space-y-3">
          {node.children.map((child) => (
            <CommentBranch key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default async function PortalPostPage({
  params,
}: {
  params: Promise<{ tenant: string; id: string }>;
}) {
  const { tenant, id } = await params;
  const decoded = decodeURIComponent(tenant);
  const post = await publicApi.getPost(decoded, id);

  if (!post) notFound();

  const tree = buildTree(post.comments ?? []);

  return (
    <div className="space-y-6">
      <Link
        href={`/portal/${decoded}/`}
        className="inline-flex items-center gap-1 text-sm text-[#1c0a0c]/60 hover:text-[#1c0a0c]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to board
      </Link>

      <Card className="p-6">
        <div className="flex gap-6">
          <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-black/5 bg-[#fdf8f9]">
            <ThumbsUp className="h-5 w-5 text-[#1c0a0c]/60" />
            <span className="text-sm font-semibold text-[#1c0a0c]">
              {post.vote_count}
            </span>
          </div>

          <div className="flex-1 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-2xl font-bold text-[#1c0a0c]">{post.title}</h1>
              <Badge className={STATUS_BADGE[post.status]}>
                {post.status.replace("_", " ")}
              </Badge>
            </div>
            <p className="whitespace-pre-wrap text-[#1c0a0c]/70">
              {post.description}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-sm text-[#1c0a0c]/60">
              <span className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                {post.comment_count} comments
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                by {post.author_name}
              </span>
              <Badge variant="outline">{post.post_type.replace("_", " ")}</Badge>
              {post.tags?.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="outline"
                  style={
                    tag.color_hex
                      ? { color: tag.color_hex, borderColor: tag.color_hex }
                      : undefined
                  }
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold text-[#1c0a0c]">
          Comments ({post.comments?.length ?? 0})
        </h2>
        {tree.length === 0 ? (
          <p className="py-8 text-center text-sm text-[#1c0a0c]/60">
            No comments yet.
          </p>
        ) : (
          <div className="space-y-3">
            {tree.map((node) => (
              <CommentBranch key={node.id} node={node} depth={0} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

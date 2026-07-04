"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ThumbsUp,
  MessageSquare,
  Calendar,
  Pencil,
  Trash2,
  Pin,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import {
  postsApi,
  votesApi,
  commentsApi,
  tenantsApi,
  extractRows,
  type Post,
  type Comment,
  type PostStatus,
} from "@/lib/api";
import { SharePost } from "@/components/portal/share-post";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000";

/** Build the public portal URL for a post from the tenant's subdomain/domain. */
function buildPublicPostUrl(
  tenant: { subdomain: string; custom_domain?: string | null },
  postId: number
): string {
  const isLocal = /localhost|127\.0\.0\.1/.test(ROOT_DOMAIN);
  const proto = isLocal ? "http" : "https";
  const host = tenant.custom_domain || `${tenant.subdomain}.${ROOT_DOMAIN}`;
  return `${proto}://${host}/post/${postId}`;
}
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { EditPostDialog } from "@/components/feedback/edit-post-dialog";
import { PostTags } from "@/components/feedback/post-tags";
import { CommentThread } from "@/components/feedback/comment-thread";
import { DuplicateManager } from "@/components/feedback/duplicate-manager";
import { toast } from "sonner";

const STATUS_OPTIONS: PostStatus[] = [
  "open",
  "planned",
  "in_progress",
  "completed",
  "closed",
];

const STATUS_BADGE: Record<string, string> = {
  open: "bg-blue-100 text-blue-700",
  planned: "bg-purple-100 text-purple-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  completed: "bg-green-100 text-green-700",
  closed: "bg-gray-100 text-gray-700",
};

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const token = session?.user?.accessToken;

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [publicUrl, setPublicUrl] = useState<string | null>(null);

  const postId = parseInt(params.id as string);

  // Resolve the tenant once to build the shareable public link for this post.
  useEffect(() => {
    if (!token || Number.isNaN(postId)) return;
    tenantsApi
      .getMine(token)
      .then((res) => {
        if (res.data?.subdomain) {
          setPublicUrl(buildPublicPostUrl(res.data, postId));
        }
      })
      .catch(() => {});
  }, [token, postId]);

  const loadPostData = useCallback(async () => {
    try {
      setLoading(true);
      const [postRes, commentsRes] = await Promise.all([
        postsApi.getById(postId, token),
        commentsApi.getByPost(postId, token),
      ]);

      if (postRes.data) {
        setPost(postRes.data);
        setHasVoted(Boolean(postRes.data.has_voted));
      }
      setComments(extractRows<Comment>(commentsRes.data, "comments"));
    } catch (error) {
      console.error("Failed to load post:", error);
      toast.error("Failed to load post");
    } finally {
      setLoading(false);
    }
  }, [postId, token]);

  useEffect(() => {
    loadPostData();
  }, [loadPostData]);

  const handleVote = async () => {
    if (!token) {
      toast.error("Please login to vote");
      return;
    }
    try {
      if (hasVoted) {
        await votesApi.remove(postId, token);
        setHasVoted(false);
        setPost((prev) =>
          prev ? { ...prev, vote_count: Math.max(0, prev.vote_count - 1) } : null
        );
      } else {
        await votesApi.add(postId, token);
        setHasVoted(true);
        setPost((prev) =>
          prev ? { ...prev, vote_count: prev.vote_count + 1 } : null
        );
      }
    } catch {
      toast.error("Failed to vote");
    }
  };

  const handleStatusChange = async (status: PostStatus) => {
    if (!token || !post) return;
    try {
      await postsApi.updateStatus(postId, status, token);
      setPost({ ...post, status });
      toast.success(`Status set to ${status.replace("_", " ")}`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleTogglePin = async () => {
    if (!token || !post) return;
    const next = post.is_pinned ? 0 : 1;
    try {
      await postsApi.pin(postId, token, next === 1);
      setPost({ ...post, is_pinned: next });
      toast.success(next ? "Post pinned" : "Post unpinned");
    } catch {
      toast.error("Failed to update pin");
    }
  };

  const handleDeletePost = async () => {
    if (!token) return;
    try {
      await postsApi.delete(postId, token);
      toast.success("Post deleted");
      router.push("/dashboard/feedback");
    } catch {
      toast.error("Failed to delete post");
    }
  };

  const handleAddComment = async () => {
    if (!token || !newComment.trim()) return;
    setSubmitting(true);
    try {
      await commentsApi.create(
        { postId, body: newComment.trim(), parentCommentId: null },
        token
      );
      setNewComment("");
      await loadPostData();
      toast.success("Comment added");
    } catch {
      toast.error("Failed to add comment");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-[#1c0a0c]/60">
        Loading post...
      </div>
    );
  }

  if (!post) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard/feedback">
          <Button variant="ghost">
            <ArrowLeft className="h-4 w-4" />
            Back to Feedback
          </Button>
        </Link>
        <Card className="p-12 text-center">
          <p className="text-[#1c0a0c]/60">Post not found</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/dashboard/feedback">
          <Button variant="ghost">
            <ArrowLeft className="h-4 w-4" />
            Back to Feedback
          </Button>
        </Link>

        <div className="flex items-center gap-2">
          {publicUrl && (
            <>
              <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4" />
                  View
                </Button>
              </a>
              <SharePost title={post.title} brand="#c74959" url={publicUrl} />
            </>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleTogglePin}
            className={post.is_pinned ? "border-[#c74959] text-[#c74959]" : ""}
          >
            <Pin
              className={`h-4 w-4 ${post.is_pinned ? "fill-[#c74959]" : ""}`}
            />
            {post.is_pinned ? "Pinned" : "Pin"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditOpen(true)}
          >
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this post?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently removes the post along with its votes and
                  comments. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={handleDeletePost}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Card className="p-6">
        <div className="flex gap-6">
          <button
            type="button"
            onClick={handleVote}
            className={`flex h-16 w-16 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border transition-colors ${
              hasVoted
                ? "border-[#c74959] bg-[#c74959] text-white"
                : "border-[#e399a3]/40 bg-white text-[#1c0a0c] hover:border-[#c74959]"
            }`}
          >
            <ThumbsUp
              className={`h-5 w-5 ${hasVoted ? "fill-white" : "text-[#c74959]"}`}
            />
            <span className="text-sm font-semibold">{post.vote_count}</span>
          </button>

          <div className="flex-1 space-y-4">
            <div>
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-2xl font-bold text-[#1c0a0c]">
                  {post.title}
                </h1>
                <Select
                  value={post.status}
                  onValueChange={(v) => handleStatusChange(v as PostStatus)}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-[#1c0a0c]/70">
                {post.description}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-[#1c0a0c]/60">
              <span className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                {comments.length} comments
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                by {post.author_name}
              </span>
              <Badge className={STATUS_BADGE[post.status]}>
                {post.status.replace("_", " ")}
              </Badge>
              <Badge variant="outline">{post.post_type.replace("_", " ")}</Badge>
              <Badge variant="outline">Priority {post.priority}</Badge>
            </div>

            <div className="border-t border-[#e399a3]/20 pt-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[#1c0a0c]/50">
                Tags
              </p>
              <PostTags postId={post.id} initialTags={post.tags ?? []} />
            </div>

            <DuplicateManager
              postId={post.id}
              duplicateOfPostId={post.duplicate_of_post_id ?? null}
              onChange={loadPostData}
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-[#1c0a0c]">
          Comments ({comments.length})
        </h3>

        <div className="space-y-4">
          <div className="space-y-2">
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[100px]"
            />
            <div className="flex justify-end">
              <Button
                onClick={handleAddComment}
                disabled={!newComment.trim() || submitting}
                className="bg-[#c74959] text-white hover:bg-[#b03f4d]"
              >
                {submitting ? "Posting..." : "Post Comment"}
              </Button>
            </div>
          </div>

          <CommentThread
            postId={post.id}
            comments={comments}
            onChange={loadPostData}
          />
        </div>
      </Card>

      <EditPostDialog
        post={post}
        open={editOpen}
        onOpenChange={setEditOpen}
        onUpdated={loadPostData}
      />
    </div>
  );
}

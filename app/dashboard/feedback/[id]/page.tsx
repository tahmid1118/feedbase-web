"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ThumbsUp, MessageSquare, Calendar } from "lucide-react";
import Link from "next/link";
import { postsApi, votesApi, commentsApi, type Post, type Comment } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

  const postId = parseInt(params.id as string);

  useEffect(() => {
    loadPostData();
  }, [postId]);

  const loadPostData = async () => {
    try {
      setLoading(true);
      const [postRes, commentsRes] = await Promise.all([
        postsApi.getById(postId, session?.user?.accessToken),
        commentsApi.getByPost(postId, session?.user?.accessToken),
      ]);

      if (postRes.data) setPost(postRes.data);
      if (commentsRes.data) setComments(commentsRes.data);
    } catch (error) {
      console.error("Failed to load post:", error);
      toast.error("Failed to load post");
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async () => {
    if (!session?.user?.accessToken) {
      toast.error("Please login to vote");
      return;
    }

    try {
      if (hasVoted) {
        await votesApi.remove(postId, session.user.accessToken);
        setHasVoted(false);
        setPost((prev) => prev ? { ...prev, vote_count: prev.vote_count - 1 } : null);
        toast.success("Vote removed");
      } else {
        await votesApi.add(postId, session.user.accessToken);
        setHasVoted(true);
        setPost((prev) => prev ? { ...prev, vote_count: prev.vote_count + 1 } : null);
        toast.success("Vote added");
      }
    } catch (error) {
      toast.error("Failed to vote");
    }
  };

  const handleAddComment = async () => {
    if (!session?.user?.accessToken || !newComment.trim()) return;

    try {
      setSubmitting(true);
      await commentsApi.create(
        { postId, body: newComment, parentCommentId: null },
        session.user.accessToken
      );
      setNewComment("");
      await loadPostData();
      toast.success("Comment added");
    } catch (error) {
      toast.error("Failed to add comment");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: "bg-blue-100 text-blue-700",
      planned: "bg-purple-100 text-purple-700",
      in_progress: "bg-yellow-100 text-yellow-700",
      completed: "bg-green-100 text-green-700",
      closed: "bg-gray-100 text-gray-700",
    };
    return colors[status] || colors.open;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-[#1c0a0c]/60">Loading post...</div>
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
      <Link href="/dashboard/feedback">
        <Button variant="ghost">
          <ArrowLeft className="h-4 w-4" />
          Back to Feedback
        </Button>
      </Link>

      <Card className="p-6">
        <div className="flex gap-6">
          <div className="flex flex-col items-center gap-2">
            <Button
              variant={hasVoted ? "default" : "outline"}
              size="lg"
              className={`h-16 w-16 flex-col gap-1 rounded-lg ${
                hasVoted 
                  ? "bg-[#c74959] hover:bg-[#b03f4d] text-white border-[#c74959]" 
                  : "bg-white border-[#e399a3]/40 hover:border-[#c74959] hover:bg-[#fdf8f9]"
              }`}
              onClick={handleVote}
            >
              <ThumbsUp className={`h-5 w-5 ${hasVoted ? "fill-white text-white" : "text-[#c74959]"}`} />
              <span className={`text-sm font-semibold ${hasVoted ? "text-white" : "text-[#1c0a0c]"}`}>
                {post.vote_count}
              </span>
            </Button>
          </div>

          <div className="flex-1 space-y-4">
            <div>
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-2xl font-bold text-[#1c0a0c]">{post.title}</h1>
                <Badge className={getStatusColor(post.status)}>
                  {post.status.replace("_", " ")}
                </Badge>
              </div>
              <p className="mt-3 text-[#1c0a0c]/70">{post.description}</p>
            </div>

            <div className="flex items-center gap-4 text-sm text-[#1c0a0c]/60">
              <span className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                {post.comment_count} comments
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                by {post.author_name}
              </span>
              <Badge variant="outline">{post.post_type.replace("_", " ")}</Badge>
              <Badge variant="outline">Priority {post.priority}</Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Comments Section */}
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

          {comments.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#1c0a0c]/60">
              No comments yet. Be the first to comment!
            </p>
          ) : (
            <div className="space-y-3">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className="rounded-lg border border-[#e399a3]/20 bg-[#fdf8f9] p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[#1c0a0c]">
                          {comment.author_name}
                        </span>
                        {comment.is_edited === 1 && (
                          <Badge variant="outline" className="text-xs">
                            Edited
                          </Badge>
                        )}
                      </div>
                      <p className="mt-2 text-sm text-[#1c0a0c]/80">{comment.body}</p>
                      <p className="mt-2 text-xs text-[#1c0a0c]/50">
                        {comment.created_at
                          ? new Date(comment.created_at).toLocaleString()
                          : "Recently"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

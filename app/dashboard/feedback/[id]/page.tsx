"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ThumbsUp,
  MessageSquare,
  Calendar,
  Trash2,
  Pin,
  Lock,
  RotateCcw,
  Ban,
  Mail,
  Send,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import {
  postsApi,
  commentsApi,
  tenantsApi,
  billingApi,
  extractRows,
  ApiError,
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
import { useTranslation } from "@/lib/i18n/client";
import { useLanguage } from "@/components/providers/i18n-provider";
import { Card } from "@/components/ui/card";
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
import { PostTags } from "@/components/feedback/post-tags";
import { CommentThread } from "@/components/feedback/comment-thread";
import { AttachmentGallery } from "@/components/feedback/attachment-gallery";
import { DuplicateManager } from "@/components/feedback/duplicate-manager";
import { toast } from "sonner";

// "closed" is intentionally omitted — it's not an offered status. The badge map
// below still includes it so any pre-existing closed posts render correctly.
const STATUS_OPTIONS: PostStatus[] = [
  "open",
  "planned",
  "in_progress",
  "completed",
];

const STATUS_BADGE: Record<string, string> = {
  open: "bg-blue-100 text-blue-700",
  planned: "bg-purple-100 text-purple-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  completed: "bg-green-100 text-green-700",
  closed: "bg-gray-100 text-gray-700",
  rejected: "bg-red-100 text-red-700",
};

export default function PostDetailPage() {
  const { t } = useTranslation();
  const lng = useLanguage();
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const isOwner = session?.user?.role === "owner";

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [publicUrl, setPublicUrl] = useState<string | null>(null);
  // Deleting feedback is a paid capability (Pro+); gate the button on the plan.
  const [canDeleteFeedback, setCanDeleteFeedback] = useState(false);
  // Seeing the submitter's email + notifying them on completion is Pro+ too.
  const [canContactSubmitter, setCanContactSubmitter] = useState(false);
  const [notifying, setNotifying] = useState(false);
  // Local override so the "notified" state updates immediately after a send.
  const [notifiedOverride, setNotifiedOverride] = useState<string | null>(null);

  const postId = parseInt(params.id as string);

  // Fetch the plan's owner-only capabilities (Pro or higher).
  useEffect(() => {
    if (!token || !isOwner) return;
    billingApi
      .getStatus(token)
      .then((res) => {
        setCanDeleteFeedback(Boolean(res.data?.limits?.deleteFeedback));
        setCanContactSubmitter(Boolean(res.data?.limits?.contactSubmitter));
      })
      .catch(() => {});
  }, [token, isOwner]);

  const notifiedAt = notifiedOverride ?? post?.implemented_notified_at ?? null;

  const handleNotifyImplemented = async () => {
    if (!token || !post) return;
    setNotifying(true);
    try {
      const res = await postsApi.notifyImplemented(post.id, token);
      setNotifiedOverride(new Date().toISOString());
      toast.success(
        res.data?.emailSent
          ? t("postDetail.emailedSubmitter")
          : t("postDetail.recordedNoMail")
      );
    } catch (e) {
      toast.error(
        (e as Error)?.message || t("postDetail.notifyFailed")
      );
    } finally {
      setNotifying(false);
    }
  };

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
      }
      setComments(extractRows<Comment>(commentsRes.data, "comments"));
    } catch (error) {
      console.error("Failed to load post:", error);
      toast.error(t("postDetail.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [postId, token, t]);

  useEffect(() => {
    loadPostData();
  }, [loadPostData]);

  const handleStatusChange = async (status: PostStatus) => {
    if (!token || !post) return;
    const wasRejected = post.status === "rejected";
    try {
      await postsApi.updateStatus(postId, status, token);
      setPost({ ...post, status });
      toast.success(
        status === "rejected"
          ? t("postDetail.feedbackRejected")
          : wasRejected && status === "open"
            ? t("postDetail.restoredToOpen")
            : t("postDetail.statusSet", { status: t(`status.${status}`) })
      );
    } catch {
      toast.error(t("postDetail.statusUpdateFailed"));
    }
  };

  const handleTogglePin = async () => {
    if (!token || !post) return;
    const next = post.is_pinned ? 0 : 1;
    try {
      await postsApi.pin(postId, token, next === 1);
      setPost({ ...post, is_pinned: next });
      toast.success(t(next ? "postDetail.postPinned" : "postDetail.postUnpinned"));
    } catch {
      toast.error(t("postDetail.pinUpdateFailed"));
    }
  };

  const handleDeletePost = async () => {
    if (!token) return;
    try {
      await postsApi.delete(postId, token);
      toast.success(t("toast.postDeleted"));
      router.push("/dashboard/feedback");
    } catch (e) {
      // Surface the backend's reason (403 owner-only / 402 upgrade required).
      toast.error(e instanceof ApiError ? e.message : t("postDetail.deleteFailed"));
    }
  };

  // Free-plan owners see the Delete control but are prompted to upgrade.
  const promptDeleteUpgrade = () => {
    toast(t("postDetail.deleteProToast"), {
      description: t("postDetail.deleteProToastDesc"),
      action: {
        label: t("common.upgrade"),
        onClick: () => router.push("/dashboard/settings?tab=billing"),
      },
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-[#1c0a0c]/60">
        {t("postDetail.loadingPost")}
      </div>
    );
  }

  if (!post) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard/feedback">
          <Button variant="ghost">
            <ArrowLeft className="h-4 w-4" />
            {t("postDetail.backToFeedback")}
          </Button>
        </Link>
        <Card className="p-12 text-center">
          <p className="text-[#1c0a0c]/60">{t("feedback.postNotFound")}</p>
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
            {t("postDetail.backToFeedback")}
          </Button>
        </Link>

        <div className="flex items-center gap-2">
          {publicUrl && (
            <SharePost title={post.title} brand="#c74959" url={publicUrl} />
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
            {t(post.is_pinned ? "postDetail.pinned" : "common.pin")}
          </Button>
          {isOwner &&
            (canDeleteFeedback ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                    {t("common.delete")}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("postOwner.deleteTitle")}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("postDetail.deleteDesc")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                    <AlertDialogAction
                      variant="destructive"
                      onClick={handleDeletePost}
                    >
                      {t("common.delete")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="text-[#1c0a0c]/50"
                onClick={promptDeleteUpgrade}
                title={t("postDetail.deleteProTitle")}
              >
                <Lock className="h-4 w-4" />
                {t("common.delete")}
              </Button>
            ))}
        </div>
      </div>

      <Card className="p-6">
        <div className="flex gap-6">
          {/* Read-only tally: only the public board votes, never the team. */}
          <div
            aria-label={`${post.vote_count} ${post.vote_count === 1 ? "upvote" : "upvotes"}`}
            title={t("postDetail.upvoteTitle")}
            className="flex h-16 w-16 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-[#e399a3]/40 bg-white text-[#1c0a0c]"
          >
            <ThumbsUp className="h-5 w-5 text-[#c74959]" />
            <span className="text-sm font-semibold">{post.vote_count}</span>
          </div>

          <div className="flex-1 space-y-4">
            <div>
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-2xl font-bold text-[#1c0a0c]">
                  {post.title}
                </h1>
                {post.status === "rejected" ? (
                  // Rejected feedback isn't a pipeline stage — offer a restore
                  // to Open rather than a status dropdown.
                  <Button
                    variant="outline"
                    className="shrink-0"
                    onClick={() => handleStatusChange("open")}
                  >
                    <RotateCcw className="h-4 w-4" />
                    {t("feedback.restoreToOpen")}
                  </Button>
                ) : (
                  <div className="flex shrink-0 items-center gap-2">
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
                            {t(`status.${s}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      className="text-[#c74959] hover:bg-[#c74959]/10 hover:text-[#c74959]"
                      onClick={() => handleStatusChange("rejected")}
                    >
                      <Ban className="h-4 w-4" />
                      {t("feedback.reject")}
                    </Button>
                  </div>
                )}
              </div>
              <p className="mt-3 whitespace-pre-wrap text-[#1c0a0c]/70">
                {post.description}
              </p>
              {post.attachments && post.attachments.length > 0 && (
                <div className="mt-4">
                  <AttachmentGallery attachments={post.attachments} />
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-[#1c0a0c]/60">
              <span className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                {t("portal.nComments", { count: comments.length })}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {t("portal.byAuthor", { name: post.author_name })}
              </span>
              <Badge className={STATUS_BADGE[post.status]}>
                {t(`status.${post.status}`)}
              </Badge>
              <Badge variant="outline">{t(`type.${post.post_type}`)}</Badge>
            </div>

            {/* Submitter contact + "implemented" notification (owner, Pro+). */}
            {isOwner && canContactSubmitter && post.author_email ? (
              <div className="rounded-lg border border-[#e399a3]/25 bg-[#fdf8f9] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wide text-[#1c0a0c]/50">
                      {t("postDetail.submitter")}
                    </p>
                    <p className="mt-1 flex items-center gap-2 text-sm text-[#1c0a0c]">
                      <Mail className="h-4 w-4 shrink-0 text-[#c74959]" />
                      <a
                        href={`mailto:${post.author_email}`}
                        className="truncate font-medium hover:underline"
                      >
                        {post.author_email}
                      </a>
                    </p>
                    {notifiedAt ? (
                      <p className="mt-1.5 text-xs font-medium text-green-700">
                        ✓{" "}
                        {t("postDetail.implementedSent", { date: new Date(notifiedAt).toLocaleDateString(lng) })}
                      </p>
                    ) : null}
                  </div>
                  {post.status === "completed" ? (
                    <Button
                      onClick={handleNotifyImplemented}
                      disabled={notifying}
                      className="bg-[#c74959] text-white hover:bg-[#b03f4d]"
                    >
                      {notifying ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      {t(notifiedAt ? "postDetail.resendImplemented" : "postDetail.notifyImplemented")}
                    </Button>
                  ) : null}
                </div>
                {post.status !== "completed" ? (
                  <p className="mt-2 text-xs text-[#1c0a0c]/50">
                    {t("postDetail.markCompletedHint")}
                  </p>
                ) : null}
              </div>
            ) : isOwner && !canContactSubmitter ? (
              <button
                type="button"
                onClick={() => router.push("/dashboard/settings?tab=billing")}
                className="flex w-full items-center gap-2.5 rounded-lg border border-[#c74959]/25 bg-[#c74959]/5 p-3 text-left text-sm text-[#1c0a0c]/70 transition-colors hover:border-[#c74959]/50 hover:bg-[#c74959]/10"
              >
                <Lock className="h-4 w-4 shrink-0 text-[#c74959]" />
                <span>
                  <span className="rounded bg-[#c74959] px-1.5 py-0.5 text-xs font-semibold text-white">
                    {t("postDetail.upgradeToPro")}
                  </span>{" "}
                  {t("postDetail.contactUpsell")}
                </span>
              </button>
            ) : null}

            <div className="border-t border-[#e399a3]/20 pt-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[#1c0a0c]/50">
                {t("postDetail.tags")}
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
        <div className="mb-4 flex items-center justify-between gap-2">
          <h3 className="text-lg font-semibold text-[#1c0a0c]">
            {t("postDetail.commentsHeading", { count: comments.length })}
          </h3>
          <span className="text-xs text-[#1c0a0c]/50">
            {t("postDetail.discussionNote")}
          </span>
        </div>

        <CommentThread comments={comments} />
      </Card>
    </div>
  );
}

import Link from "next/link";
import { MessageSquare, Paperclip } from "lucide-react";
import { publicApi, normalizeBoardSort } from "@/lib/api/public";
import { Badge } from "@/components/ui/badge";
import { FeedbackSubmit } from "@/components/portal/feedback-submit";
import { PortalVoteButton } from "@/components/portal/portal-vote-button";
import { BoardSort } from "@/components/portal/board-sort";
import { LocalTime } from "@/components/local-time";
import { getTranslation } from "@/lib/i18n/server";

const DEFAULT_BRAND = "#c74959";

const STATUS_BADGE: Record<string, string> = {
  open: "bg-blue-100 text-blue-700",
  planned: "bg-purple-100 text-purple-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  completed: "bg-green-100 text-green-700",
  closed: "bg-gray-100 text-gray-700",
  rejected: "bg-red-100 text-red-700",
};

const TYPE_ICON: Record<string, string> = {
  bug_report: "🐛",
  feature_request: "✨",
  feedback: "💬",
};

export default async function PortalBoardPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<{ sort?: string }>;
}) {
  const { tenant } = await params;
  const decoded = decodeURIComponent(tenant);
  const { t } = await getTranslation();
  const sort = normalizeBoardSort((await searchParams)?.sort);
  // getTenant is React-cached, so this shares the layout's tenant lookup.
  const [data, info] = await Promise.all([
    publicApi.getBoard(decoded, undefined, 100, sort),
    publicApi.getTenant(decoded),
  ]);
  const posts = data?.posts ?? [];
  const brand = info?.branding_primary_color || DEFAULT_BRAND;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1c0a0c]">
            {t("portal.boardTitle")}
          </h1>
          <p className="text-sm text-[#1c0a0c]/60">
            {t("portal.boardSubtitle")}
          </p>
        </div>
        <FeedbackSubmit
          tenant={decoded}
          brand={brand}
          attachmentsEnabled={Boolean(info?.attachments_enabled)}
        />
      </div>

      {posts.length === 0 ? (
        <div className="rounded-xl border border-black/5 bg-white p-12 text-center text-[#1c0a0c]/60">
          {t("portal.noFeedbackYet")}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex justify-end">
            <BoardSort value={sort} />
          </div>
          {posts.map((post) => (
            <div
              key={post.id}
              className="relative isolate rounded-xl border border-black/5 bg-white p-4 transition-shadow hover:shadow-md"
            >
              <Link
                href={`/portal/${decoded}/post/${post.id}`}
                aria-label={t("portal.openPost", { title: post.title })}
                className="absolute inset-0 z-[1] rounded-xl"
              />
              <div className="flex items-start gap-4">
                <PortalVoteButton
                  tenant={decoded}
                  postId={post.id}
                  initialCount={post.vote_count}
                  brand={brand}
                />

                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span>{TYPE_ICON[post.post_type] ?? "💬"}</span>
                        <h3 className="font-semibold text-[#1c0a0c]">
                          {post.title}
                        </h3>
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-[#1c0a0c]/70">
                        {post.description}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${STATUS_BADGE[post.status]}`}
                    >
                      {t(`status.${post.status}`)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#1c0a0c]/60">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {t("portal.nComments", { count: post.comment_count ?? 0 })}
                    </span>
                    {(post.attachment_count ?? 0) > 0 && (
                      <span className="flex items-center gap-1">
                        <Paperclip className="h-3 w-3" />
                        {post.attachment_count}
                      </span>
                    )}
                    {post.created_at && (
                      <LocalTime date={post.created_at} relative />
                    )}
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

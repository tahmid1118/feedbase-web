import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { ArrowLeft, ThumbsUp, MessageSquare, Calendar } from "@/components/icons";
import { publicApi } from "@/lib/api/public";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PortalComments } from "@/components/portal/portal-comments";
import { SharePost } from "@/components/portal/share-post";
import { AttachmentGallery } from "@/components/feedback/attachment-gallery";
import { PostOwnerActions } from "@/components/portal/post-owner-actions";
import { LocalTime } from "@/components/local-time";
import { resolveUploadUrl } from "@/lib/avatar";
import { guestIdentity, colorFor } from "@/lib/portal/anon-identity";
import { IncognitoIcon } from "@/components/portal/incognito-icon";
import { VerifiedBadge } from "@/components/portal/verified-badge";
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

// Rich link previews (Open Graph + Twitter Card) so a shared post URL unfurls
// with the post title, summary, and the branded OG image (opengraph-image.tsx).
export async function generateMetadata({
  params,
}: {
  params: Promise<{ tenant: string; id: string }>;
}): Promise<Metadata> {
  const { tenant, id } = await params;
  const decoded = decodeURIComponent(tenant);
  const [post, info] = await Promise.all([
    publicApi.getPost(decoded, id),
    publicApi.getTenant(decoded),
  ]);

  if (!post) {
    const { t } = await getTranslation();
    return { title: t("portal.postNotFound") };
  }

  const siteName = info?.name || "Feedback";
  const title = `${post.title} · ${siteName}`;
  const description =
    (post.description || "").trim().slice(0, 200) ||
    `A feedback post on ${siteName}.`;

  // Resolve the base from the request host so OG URLs are correct on the
  // tenant's subdomain / custom domain (not a hardcoded origin).
  const h = await headers();
  const host =
    h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") ||
    (host.includes("localhost") ? "http" : "https");

  return {
    metadataBase: new URL(`${proto}://${host}`),
    title,
    description,
    openGraph: { title, description, siteName, type: "article" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function PortalPostPage({
  params,
}: {
  params: Promise<{ tenant: string; id: string }>;
}) {
  const { tenant, id } = await params;
  const decoded = decodeURIComponent(tenant);
  const { t } = await getTranslation();
  // getTenant is React-cached, so this shares the layout's tenant lookup.
  const [post, info] = await Promise.all([
    publicApi.getPost(decoded, id),
    publicApi.getTenant(decoded),
  ]);

  if (!post) notFound();

  const brand = info?.branding_primary_color || DEFAULT_BRAND;

  // Author display: real identity for logged-in authors; a stable friendly
  // pseudonym + colour for anonymous guests (keyed off guest_id so it matches
  // that guest's comments), the given name for guests who left one.
  const author =
    post.author_id != null
      ? {
          name: post.author_name,
          avatar: post.author_avatar ?? null,
          color: colorFor(post.author_name || String(post.author_id)),
          anonymous: false,
        }
      : post.author_name && post.author_name !== "Anonymous"
        ? {
            name: post.author_name,
            avatar: null,
            color: colorFor(post.guest_id || post.author_name),
            anonymous: false,
          }
        : (() => {
            const id = guestIdentity(post.guest_id || `p${post.id}`);
            return {
              name: id.name,
              avatar: null,
              color: id.color,
              anonymous: true,
            };
          })();

  return (
    <div className="space-y-4 sm:space-y-6">
      <Link
        href={`/portal/${decoded}/`}
        className="inline-flex items-center gap-1 text-sm text-[#1c0a0c]/60 hover:text-[#1c0a0c]"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("portal.backToBoard")}
      </Link>

      {/* Tighter on a phone throughout. Every gap here was tuned at desktop
          width, and stacked up they pushed the comments — the reason most
          visitors open a post at all — well below the fold. */}
      {/* Card is itself a flex column, so its own `gap` spaces these children —
          no per-block margins to keep in sync. */}
      <Card className="gap-2.5 p-3 sm:gap-4 sm:p-6">
        {/* The vote tally sits beside the TITLE ONLY. It used to be the first
            child of a flex row wrapping the entire card body, which locked the
            description, attachments and meta line into a column indented past
            a 44px box that had already ended several lines earlier — a tall
            empty gutter down the left of the card. They're siblings now, so
            the body text starts at the card's left edge and uses the full
            width. */}
        <div className="flex items-start gap-2.5 sm:gap-6">
          <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg border border-black/5 bg-[#fdf8f9] sm:h-16 sm:w-16 sm:gap-1">
            <ThumbsUp className="h-4 w-4 text-[#1c0a0c]/60 sm:h-5 sm:w-5" />
            <span className="text-xs font-semibold text-[#1c0a0c] sm:text-sm">
              {post.vote_count}
            </span>
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
            <h1 className="min-w-0 text-lg leading-snug font-bold break-words text-[#1c0a0c] sm:text-2xl sm:leading-tight">
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:justify-end">
              <Badge className={STATUS_BADGE[post.status]}>
                {t(`status.${post.status}`)}
              </Badge>
              <SharePost title={post.title} brand={brand} />
              <PostOwnerActions
                tenant={decoded}
                postId={post.id}
                authorId={post.author_id ?? null}
                title={post.title}
                description={post.description}
                postType={post.post_type}
              />
            </div>
          </div>
        </div>

        <p className="text-sm leading-relaxed whitespace-pre-wrap text-[#1c0a0c]/70 sm:text-base">
          {post.description}
        </p>

        {post.attachments && post.attachments.length > 0 && (
          <AttachmentGallery attachments={post.attachments} />
        )}

        {/* gap-x/gap-y split: at a uniform gap-4 these four items wrapped
            onto three near-empty lines on a phone. Tightening the vertical
            gap lets them pack onto one or two. */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#1c0a0c]/60 sm:gap-x-4 sm:gap-y-2 sm:text-sm">
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                {t("portal.nComments", { count: post.comment_count ?? 0 })}
              </span>
              <span className="flex items-center gap-1.5">
                {author.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={resolveUploadUrl(author.avatar)}
                    alt={author.name}
                    className="h-5 w-5 rounded-full object-cover"
                  />
                ) : (
                  <span
                    className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold text-white"
                    style={{ backgroundColor: author.color }}
                  >
                    {author.anonymous ? (
                      <IncognitoIcon size={13} />
                    ) : (
                      author.name.charAt(0).toUpperCase()
                    )}
                  </span>
                )}
                {t("portal.byAuthor", { name: author.name })}
                {post.author_is_admin ? <VerifiedBadge size={14} /> : null}
              </span>
              {post.created_at && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <LocalTime date={post.created_at} />
                </span>
              )}
              <Badge variant="outline">{t(`type.${post.post_type}`)}</Badge>
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
      </Card>

      <Card className="p-4 sm:p-6">
        <h2 className="mb-4 text-lg font-semibold text-[#1c0a0c]">
          {t("portal.commentsHeading", { count: post.comments?.length ?? 0 })}
        </h2>
        <PortalComments
          tenant={decoded}
          postId={post.id}
          comments={post.comments ?? []}
          brand={brand}
          boardTenantId={info?.id}
          boardOwnerBadge={info?.owner_badge_enabled}
          boardOwnerPrivacy={info?.owner_privacy_enabled}
        />
      </Card>
    </div>
  );
}

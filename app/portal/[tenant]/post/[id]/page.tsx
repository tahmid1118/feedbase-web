import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { ArrowLeft, ThumbsUp, MessageSquare, Calendar } from "lucide-react";
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

const DEFAULT_BRAND = "#c74959";

const STATUS_BADGE: Record<string, string> = {
  open: "bg-blue-100 text-blue-700",
  planned: "bg-purple-100 text-purple-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  completed: "bg-green-100 text-green-700",
  closed: "bg-gray-100 text-gray-700",
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

  if (!post) return { title: "Post not found" };

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
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                <Badge className={STATUS_BADGE[post.status]}>
                  {post.status.replace("_", " ")}
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
            <p className="whitespace-pre-wrap text-[#1c0a0c]/70">
              {post.description}
            </p>

            {post.attachments && post.attachments.length > 0 && (
              <div className="mt-4">
                <AttachmentGallery attachments={post.attachments} />
              </div>
            )}

            <div className="flex flex-wrap items-center gap-4 text-sm text-[#1c0a0c]/60">
              <span className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                {post.comment_count} comments
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
                by {author.name}
              </span>
              {post.created_at && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <LocalTime date={post.created_at} />
                </span>
              )}
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
        <PortalComments
          tenant={decoded}
          postId={post.id}
          comments={post.comments ?? []}
          brand={brand}
        />
      </Card>
    </div>
  );
}

import { ImageResponse } from "next/og";
import { publicApi } from "@/lib/api/public";

// Branded 1200×630 preview card rendered when a post link is shared.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Feedback post";

const DEFAULT_BRAND = "#c74959";

const STATUS_LABEL: Record<string, string> = {
  open: "Open",
  planned: "Planned",
  in_progress: "In progress",
  completed: "Completed",
  closed: "Closed",
};

export default async function OgImage({
  params,
}: {
  params: Promise<{ tenant: string; id: string }>;
}) {
  const { tenant, id } = await params;
  const decoded = decodeURIComponent(tenant);
  const [post, info] = await Promise.all([
    publicApi.getPost(decoded, id),
    publicApi.getTenant(decoded),
  ]);

  const brand = info?.branding_primary_color || DEFAULT_BRAND;
  const name = info?.name || "Feedback";
  const title = post?.title || "Feedback";
  const displayTitle = title.length > 90 ? `${title.slice(0, 90)}…` : title;
  const status = post ? STATUS_LABEL[post.status] || post.status : null;
  const votes = post?.vote_count ?? 0;
  const comments = post?.comment_count ?? 0;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          color: "white",
          fontFamily: "sans-serif",
          background: `linear-gradient(135deg, ${brand} 0%, ${brand} 55%, rgba(0,0,0,0.28) 100%)`,
        }}
      >
        {/* Tenant */}
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "rgba(255,255,255,0.22)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 36,
              fontWeight: 700,
            }}
          >
            {name.charAt(0).toUpperCase()}
          </div>
          <div style={{ fontSize: 34, fontWeight: 600, opacity: 0.95 }}>
            {name}
          </div>
        </div>

        {/* Title + status */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {status && (
            <div style={{ display: "flex" }}>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 600,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  background: "rgba(255,255,255,0.22)",
                  padding: "8px 20px",
                  borderRadius: 999,
                }}
              >
                {status}
              </div>
            </div>
          )}
          <div
            style={{
              display: "flex",
              fontSize: 66,
              fontWeight: 800,
              lineHeight: 1.1,
            }}
          >
            {displayTitle}
          </div>
        </div>

        {/* Footer stats */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "40px",
            fontSize: 30,
            opacity: 0.92,
          }}
        >
          <div style={{ display: "flex" }}>▲ {votes} upvotes</div>
          <div style={{ display: "flex" }}>{comments} comments</div>
        </div>
      </div>
    ),
    { ...size }
  );
}

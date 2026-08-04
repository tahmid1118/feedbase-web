import { ImageResponse } from "next/og";

// Branded 1200×630 preview card for the marketing/auth pages (landing,
// pricing, legal, login, signup, …) — any route under app/ that doesn't
// define its own opengraph-image inherits this one. Same construction as
// app/portal/[tenant]/post/[id]/opengraph-image.tsx (the per-post preview),
// just without any per-page dynamic content: this is the site's own card, not
// a specific post's.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "FeedBoard — Feedback Board & Public Roadmap Software";

export default async function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          color: "white",
          fontFamily: "sans-serif",
          background:
            "linear-gradient(135deg, #c74959 0%, #7a2d38 55%, #1c0a0c 100%)",
        }}
      >
        {/* Wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: "22px" }}>
          {/* Same three-rect "F" as components/ui/logo.tsx / app/icon.svg */}
          <svg width={76} height={76} viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="9" fill="rgba(255,255,255,0.16)" />
            <rect x="8" y="6" width="5" height="20" rx="2.5" fill="#fff" />
            <rect
              x="8"
              y="6"
              width="16"
              height="5"
              rx="2.5"
              fill="#fff"
              opacity="0.62"
            />
            <rect x="8" y="13.5" width="11.5" height="5" rx="2.5" fill="#fff" />
          </svg>
          <div style={{ fontSize: 44, fontWeight: 700 }}>FeedBoard</div>
        </div>

        {/* Headline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "22px",
            maxWidth: 980,
          }}
        >
          <div style={{ display: "flex", fontSize: 62, fontWeight: 800, lineHeight: 1.12 }}>
            Turn feedback into a product roadmap your users can see
          </div>
          <div style={{ display: "flex", fontSize: 30, opacity: 0.85, lineHeight: 1.4 }}>
            Collect feedback, vote on what matters, ship in public.
          </div>
        </div>

        {/* Footer facts */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "40px",
            fontSize: 26,
            opacity: 0.85,
          }}
        >
          <div style={{ display: "flex" }}>Free plan, no card</div>
          <div style={{ display: "flex" }}>Anonymous feedback included</div>
          <div style={{ display: "flex" }}>8 languages</div>
        </div>
      </div>
    ),
    { ...size }
  );
}

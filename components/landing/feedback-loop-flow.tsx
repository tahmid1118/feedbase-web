"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useTranslation } from "@/lib/i18n/client";

/**
 * "How it works" — a flat-design process infographic of the Feedbase feedback
 * loop. Ported from a Claude Design document; the visual composition, figures
 * and connector geometry are that design's, adapted to a React client component
 * and wired through the app's i18n.
 *
 * DESKTOP: a fixed 1520×648 "stage" (drawn at full detail) is scaled with a
 * transform to fit the container, so the five acts keep their exact relative
 * positions and the serpentine connector at any width. A ResizeObserver keeps
 * the scale current; the transform doesn't affect layout height, so the wrapper
 * reserves `648 × scale`.
 *
 * MOBILE: the same five acts as a stacked vertical timeline (pure CSS layout,
 * no scaling). Desktop/mobile are chosen by a CSS breakpoint, not JS, to avoid
 * a hydration flash — only the desktop scale needs JS.
 *
 * Scenes fade/rise in on scroll via IntersectionObserver; everything degrades
 * to static under `prefers-reduced-motion` (handled in CSS).
 */

const STAGE_W = 1520;
const STAGE_H = 648;

/** Reusable SVG symbol library — four figures + line icons. Rendered once. */
function Defs() {
  return (
    <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden="true">
      <symbol id="flf-figA" viewBox="0 0 110 250">
        <ellipse cx="47" cy="240" rx="8" ry="3.5" fill="#2a1416" />
        <ellipse cx="63" cy="240" rx="8" ry="3.5" fill="#2a1416" />
        <rect x="42" y="150" width="11" height="88" rx="4" fill="#2f2328" />
        <rect x="57" y="150" width="11" height="88" rx="4" fill="#37292e" />
        <path d="M39 63 Q55 56 71 63 L75 133 Q75 152 66 152 L44 152 Q35 152 35 133 Z" fill="#4a3f48" />
        <path d="M55 58 L46 63 L55 108 L64 63 Z" fill="#f3ece4" />
        <path d="M55 58 L46 63 L50 96 L55 70 Z" fill="#3f3540" />
        <path d="M55 58 L64 63 L60 96 L55 70 Z" fill="#3f3540" />
        <path d="M55 62 L52 68 L54 106 L56 106 L58 68 Z" fill="#c74959" />
        <rect x="33" y="67" width="9" height="60" rx="4.5" fill="#4a3f48" />
        <rect x="68" y="67" width="9" height="60" rx="4.5" fill="#4a3f48" />
        <circle cx="37.5" cy="129" r="5" fill="#e3b58c" />
        <circle cx="72.5" cy="129" r="5" fill="#e3b58c" />
        <rect x="51" y="47" width="8" height="14" fill="#e3b58c" />
        <circle cx="55" cy="33" r="15.5" fill="#e3b58c" />
        <path d="M39 36 Q39 14 55 14 Q71 14 71 36 Q71 30 63 29 Q60 24 55 24 Q50 24 47 29 Q39 30 39 36 Z" fill="#2a1c1a" />
      </symbol>
      <symbol id="flf-figB" viewBox="0 0 110 250">
        <ellipse cx="47" cy="240" rx="8" ry="3.5" fill="#2a1416" />
        <ellipse cx="63" cy="240" rx="8" ry="3.5" fill="#2a1416" />
        <rect x="42" y="152" width="11" height="86" rx="4" fill="#2f2328" />
        <rect x="57" y="152" width="11" height="86" rx="4" fill="#37292e" />
        <path d="M38 65 Q55 58 72 65 L76 135 Q76 154 66 154 L44 154 Q34 154 34 135 Z" fill="#5a4750" />
        <path d="M55 60 L48 65 L55 104 L62 65 Z" fill="#f3ece4" />
        <path d="M55 60 L48 65 L51 95 L55 72 Z" fill="#4a3941" />
        <path d="M55 60 L62 65 L59 95 L55 72 Z" fill="#4a3941" />
        <rect x="52" y="66" width="6" height="9" rx="1.5" fill="#c74959" />
        <rect x="32" y="69" width="9" height="54" rx="4.5" fill="#5a4750" />
        <rect x="69" y="69" width="9" height="54" rx="4.5" fill="#5a4750" />
        <circle cx="36.5" cy="125" r="5" fill="#cf9b6e" />
        <circle cx="73.5" cy="125" r="5" fill="#cf9b6e" />
        <rect x="51" y="49" width="8" height="14" fill="#cf9b6e" />
        <circle cx="55" cy="34" r="15" fill="#cf9b6e" />
        <path d="M40 37 Q40 16 55 16 Q70 16 70 37 Q70 30 63 29 Q60 25 55 25 Q50 25 47 29 Q40 30 40 37 Z" fill="#3d2420" />
        <circle cx="55" cy="15" r="6" fill="#3d2420" />
      </symbol>
      <symbol id="flf-figC" viewBox="0 0 110 250">
        <ellipse cx="47" cy="240" rx="8" ry="3.5" fill="#2a1416" />
        <ellipse cx="63" cy="240" rx="8" ry="3.5" fill="#2a1416" />
        <rect x="42" y="150" width="11" height="88" rx="4" fill="#2f2328" />
        <rect x="57" y="150" width="11" height="88" rx="4" fill="#37292e" />
        <path d="M39 63 Q55 56 71 63 L75 133 Q75 152 66 152 L44 152 Q35 152 35 133 Z" fill="#8f4a56" />
        <path d="M55 58 L46 63 L55 106 L64 63 Z" fill="#f3ece4" />
        <path d="M55 58 L46 63 L50 95 L55 70 Z" fill="#7a3d48" />
        <path d="M55 58 L64 63 L60 95 L55 70 Z" fill="#7a3d48" />
        <path d="M55 62 L52 68 L54 104 L56 104 L58 68 Z" fill="#c74959" />
        <rect x="33" y="67" width="9" height="58" rx="4.5" fill="#8f4a56" />
        <circle cx="37.5" cy="127" r="5" fill="#b98155" />
        <path d="M69 67 L84 41 Q87 36 91 39 Q94 42 91 47 L79 73 Z" fill="#8f4a56" />
        <circle cx="88" cy="40" r="5" fill="#b98155" />
        <rect x="51" y="47" width="8" height="14" fill="#b98155" />
        <circle cx="55" cy="33" r="15.5" fill="#b98155" />
        <path d="M39 33 Q39 13 55 13 Q71 13 71 33 L72 68 Q66 62 66 40 Q66 28 55 28 Q44 28 44 40 Q44 62 38 68 Z" fill="#241814" />
      </symbol>
      <symbol id="flf-figD" viewBox="0 0 110 250">
        <ellipse cx="47" cy="240" rx="8" ry="3.5" fill="#2a1416" />
        <ellipse cx="63" cy="240" rx="8" ry="3.5" fill="#2a1416" />
        <rect x="42" y="152" width="11" height="86" rx="4" fill="#2f2328" />
        <rect x="57" y="152" width="11" height="86" rx="4" fill="#37292e" />
        <path d="M38 65 Q55 58 72 65 L76 135 Q76 154 66 154 L44 154 Q34 154 34 135 Z" fill="#7a4550" />
        <path d="M55 60 L47 65 L55 104 L63 65 Z" fill="#f3ece4" />
        <path d="M55 60 L47 65 L51 92 L55 71 Z" fill="#663a44" />
        <path d="M55 60 L63 65 L59 92 L55 71 Z" fill="#663a44" />
        <path d="M55 64 L52 69 L54 96 L56 96 L58 69 Z" fill="#c74959" />
        <path d="M36 76 Q40 106 52 121 L58 113 Q46 99 44 74 Z" fill="#8f5560" />
        <path d="M74 76 Q70 106 58 121 L52 113 Q64 99 66 74 Z" fill="#8f5560" />
        <rect x="46" y="112" width="18" height="13" rx="2" fill="#ffffff" stroke="#e399a3" strokeWidth="1" />
        <path d="M46 113 L55 120 L64 113" fill="none" stroke="#e399a3" strokeWidth="1" />
        <circle cx="51" cy="119" r="4.5" fill="#d9a97f" />
        <circle cx="59" cy="119" r="4.5" fill="#d9a97f" />
        <rect x="51" y="49" width="8" height="14" fill="#d9a97f" />
        <circle cx="55" cy="34" r="15" fill="#d9a97f" />
        <path d="M40 35 Q40 15 55 15 Q70 15 70 35 Q68 27 57 27 L47 31 Q43 33 40 41 Z" fill="#1c1416" />
      </symbol>

      <symbol id="flf-iconUp" viewBox="0 0 24 24"><path d="M18 15l-6-6-6 6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></symbol>
      <symbol id="flf-iconMsg" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></symbol>
      <symbol id="flf-iconKanban" viewBox="0 0 24 24"><path d="M3 3h18v18H3z M8 3v18 M16 3v18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></symbol>
      <symbol id="flf-iconMail" viewBox="0 0 24 24"><path d="M4 5h16v14H4z M4 7l8 6 8-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></symbol>
      <symbol id="flf-iconCheck" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></symbol>
      <symbol id="flf-iconBell" viewBox="0 0 24 24"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9 M13.7 21a2 2 0 0 1-3.4 0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></symbol>
      <symbol id="flf-iconLoop" viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-2.64-6.36 M21 3v5h-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></symbol>
      <symbol id="flf-iconTag" viewBox="0 0 24 24"><path d="M20.6 13.4L13.4 20.6a2 2 0 0 1-2.8 0l-7.2-7.2A2 2 0 0 1 3 12V5a2 2 0 0 1 2-2h7a2 2 0 0 1 1.4.6l7.2 7.2a2 2 0 0 1 0 2.8z M7 7h.01" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></symbol>
      <symbol id="flf-iconSparkle" viewBox="0 0 24 24"><path d="M12 3l1.9 5.6L19.5 11l-5.6 2L12 19l-1.9-6L4.5 11l5.6-2.4z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></symbol>
      <symbol id="flf-iconTrend" viewBox="0 0 24 24"><path d="M3 17l6-6 4 4 8-8 M21 7v5h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></symbol>
      <symbol id="flf-iconDown" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></symbol>
    </svg>
  );
}

/** Shorthand: an icon that references a symbol from Defs. */
function Icon({ id, size = 16, color }: { id: string; size?: number; color?: string }) {
  return (
    <svg width={size} height={size} style={color ? { color } : undefined} aria-hidden="true">
      <use href={`#flf-${id}`} />
    </svg>
  );
}

/** A figure symbol at a given rendered size. */
function Figure({ id, w, h, style }: { id: string; w: number; h: number; style?: CSSProperties }) {
  return (
    <svg width={w} height={h} viewBox="0 0 110 250" style={style} aria-hidden="true">
      <use href={`#flf-${id}`} />
    </svg>
  );
}

const CSS = `
.flf-root{--r:#c74959;--r2:#da6a78;--r3:#e399a3;--ink:#1c0a0c;--bg:#fdf8f9}
@keyframes flf-floatY{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes flf-floatY2{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
@keyframes flf-driftY{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
@keyframes flf-dash{to{stroke-dashoffset:-160}}
.flf-scene{opacity:0;transform:translateY(22px);transition:opacity .7s cubic-bezier(.2,.7,.2,1),transform .7s cubic-bezier(.2,.7,.2,1)}
.flf-scene.flf-in{opacity:1;transform:none}
@media (prefers-reduced-motion: reduce){
  .flf-root *{animation:none!important;transition:none!important}
  .flf-scene{opacity:1!important;transform:none!important}
}
`;

// ── shared inline-style fragments ──────────────────────────────────────────
const card: CSSProperties = {
  background: "#fff",
  borderRadius: 18,
  border: "1px solid rgba(227,153,163,.45)",
  boxShadow: "0 18px 40px -14px rgba(199,73,89,.28)",
};
const numBadge: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 30,
  height: 30,
  borderRadius: 9,
  background: "#c74959",
  color: "#fff",
  fontWeight: 700,
  fontSize: 14,
};
const pill: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "5px 11px",
  borderRadius: 999,
  background: "#fff",
  border: "1px solid rgba(227,153,163,.5)",
  fontSize: 11,
  fontWeight: 600,
  color: "#c74959",
};
const statusPill = (bg: string, fg: string): CSSProperties => ({
  fontSize: 10,
  fontWeight: 700,
  padding: "3px 8px",
  borderRadius: 999,
  background: bg,
  color: fg,
});

export function FeedbackLoopFlow() {
  const { t } = useTranslation();
  const wrapRef = useRef<HTMLDivElement | null>(null);
  // Start near the resting scale (container ≈1200 / stage 1520) so first paint
  // is close before the ResizeObserver corrects it.
  const [scale, setScale] = useState(0.79);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const measure = () => {
      const w = wrap.clientWidth || STAGE_W;
      setScale(Math.max(0.42, Math.min(1, w / STAGE_W)));
    };

    const ro = new ResizeObserver(() => {
      measure();
      // Re-observe scenes after a resize: the breakpoint swap reveals a
      // previously display:none set that IntersectionObserver hadn't seen.
      requestAnimationFrame(observe);
    });
    ro.observe(wrap);
    measure();

    let io: IntersectionObserver | null = null;
    function observe() {
      if (!io || !wrap) return;
      wrap.querySelectorAll<HTMLElement>(".flf-scene:not(.flf-in)").forEach((el) => io!.observe(el));
    }
    if (typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add("flf-in");
              io!.unobserve(e.target);
            }
          });
        },
        { threshold: 0.12 }
      );
      requestAnimationFrame(observe);
    } else {
      // No IO: reveal everything so nothing is stuck invisible.
      wrap.querySelectorAll(".flf-scene").forEach((el) => el.classList.add("flf-in"));
    }

    return () => {
      ro.disconnect();
      io?.disconnect();
    };
  }, []);

  const stageH = Math.round(STAGE_H * scale);

  return (
    <section
      className="flf-root"
      style={{
        padding: "clamp(48px,7vw,110px) 20px 96px",
        background: "radial-gradient(1200px 600px at 50% -8%,#fdeef0 0%,#fdf8f9 60%)",
      }}
    >
      <style>{CSS}</style>
      <Defs />

      <div style={{ maxWidth: 1240, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 14px",
              border: "1px solid rgba(227,153,163,.55)",
              background: "#fff",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: ".16em",
              color: "#c74959",
              textTransform: "uppercase",
            }}
          >
            <Icon id="iconLoop" size={14} color="#c74959" />
            {t("landing.how.eyebrow")}
          </div>
          <h2
            style={{
              margin: "20px 0 0",
              fontSize: "clamp(30px,5vw,54px)",
              fontWeight: 700,
              lineHeight: 1.04,
              letterSpacing: "-.02em",
              textWrap: "balance",
            }}
          >
            {t("landing.how.heading")}
          </h2>
          <p
            style={{
              margin: "18px auto 0",
              maxWidth: 620,
              fontSize: "clamp(16px,2.3vw,20px)",
              lineHeight: 1.5,
              color: "rgba(28,10,12,.66)",
              textWrap: "pretty",
            }}
          >
            {t("landing.how.subheading")}
          </p>
        </div>

        <div ref={wrapRef} style={{ maxWidth: 1200, margin: "clamp(36px,5vw,64px) auto 0", position: "relative" }}>
          {/* ── DESKTOP: scaled stage ─────────────────────────────────── */}
          <div className="hidden lg:block" style={{ height: stageH, position: "relative", overflow: "hidden" }}>
            <div style={{ width: STAGE_W, height: STAGE_H, transform: `scale(${scale})`, transformOrigin: "top left", position: "relative" }}>
              {/* ambient blobs */}
              <div style={{ position: "absolute", width: 520, height: 520, left: -100, top: 60, borderRadius: "50%", background: "radial-gradient(circle,rgba(218,106,120,.1),transparent 70%)" }} />
              <div style={{ position: "absolute", width: 560, height: 560, right: -120, top: 20, borderRadius: "50%", background: "radial-gradient(circle,rgba(227,153,163,.12),transparent 70%)" }} />

              {/* connector paths */}
              <svg viewBox="0 0 1520 648" width={1520} height={648} style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none", zIndex: 1 }}>
                <defs>
                  <marker id="flf-ah" markerWidth="9" markerHeight="9" refX="5.5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 Z" fill="#c74959" /></marker>
                  <marker id="flf-ah2" markerWidth="11" markerHeight="11" refX="6.5" refY="3.4" orient="auto"><path d="M0 0 L7 3.4 L0 6.8 Z" fill="#c74959" /></marker>
                </defs>
                <path d="M250 158 C 350 158, 350 288, 452 288 C 560 288, 640 158, 744 158 C 850 158, 944 288, 1046 288 C 1155 288, 1245 158, 1336 158" fill="none" stroke="#da6a78" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="2 9" markerEnd="url(#flf-ah)" style={{ animation: "flf-dash 28s linear infinite" }} />
                <path d="M1378 452 C 1520 596, 940 616, 760 616 C 420 616, -20 596, 150 452" fill="none" stroke="#c74959" strokeWidth="4.5" strokeLinecap="round" markerEnd="url(#flf-ah2)" />
              </svg>

              {/* ACT 1 — Users ask */}
              <div className="flf-scene" style={{ position: "absolute", left: 0, top: 0, width: 300, height: 680, zIndex: 2, transitionDelay: ".03s" }}>
                <div style={{ position: "absolute", top: 44, left: 8, display: "inline-flex", alignItems: "center", gap: 9 }}>
                  <span style={numBadge}>01</span>
                  <span style={{ fontWeight: 700, fontSize: 17 }}>{t("landing.flow.ask.title")}</span>
                </div>
                <div style={{ ...card, position: "absolute", top: 84, left: 8, width: 250, padding: "14px 15px", animation: "flf-floatY 6s ease-in-out infinite" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(28,10,12,.5)", fontSize: 11, fontWeight: 600 }}>
                        <Icon id="iconMsg" size={13} />
                        {t("landing.flow.featureRequest")}
                      </div>
                      <div style={{ marginTop: 5, fontSize: 16, fontWeight: 700 }}>{t("landing.mock.post1")}</div>
                      <div style={{ marginTop: 3, fontSize: 12, color: "rgba(28,10,12,.55)" }}>{t("landing.flow.darkModeSub")}</div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, background: "#fdf1f2", border: "1px solid rgba(227,153,163,.5)", borderRadius: 12, padding: "7px 9px", color: "#c74959", flexShrink: 0 }}>
                      <Icon id="iconUp" size={15} />
                      <span style={{ fontSize: 13, fontWeight: 700, lineHeight: 1 }}>128</span>
                    </div>
                  </div>
                </div>
                <div style={{ ...pill, position: "absolute", top: 214, left: 20, animation: "flf-floatY2 7s ease-in-out infinite" }}>{t("landing.flow.noAccount")}</div>
                <div style={{ position: "absolute", left: 40, bottom: 224, width: 104, height: 170 }}><Figure id="figA" w={104} h={170} style={{ animation: "flf-driftY 8s ease-in-out infinite .4s" }} /></div>
                <div style={{ position: "absolute", left: 150, bottom: 224, width: 112, height: 184 }}><Figure id="figB" w={112} h={184} style={{ animation: "flf-driftY 9s ease-in-out infinite" }} /></div>
              </div>

              {/* ACT 2 — The crowd votes */}
              <div className="flf-scene" style={{ position: "absolute", left: 312, top: 0, width: 300, height: 680, zIndex: 2, transitionDelay: ".12s" }}>
                <div style={{ position: "absolute", top: 156, left: 8, display: "inline-flex", alignItems: "center", gap: 9 }}>
                  <span style={numBadge}>02</span>
                  <span style={{ fontWeight: 700, fontSize: 17 }}>{t("landing.flow.vote.title")}</span>
                </div>
                <div style={{ ...card, position: "absolute", top: 196, left: 8, width: 250, padding: 14, boxShadow: "0 18px 40px -14px rgba(199,73,89,.26)", animation: "flf-floatY 6.6s ease-in-out infinite .2s" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, fontWeight: 700, fontSize: 13 }}>
                    <Icon id="iconTrend" size={15} color="#c74959" />
                    {t("landing.flow.mostWanted")}
                  </div>
                  <div style={{ marginTop: 11, display: "flex", flexDirection: "column", gap: 9 }}>
                    {[
                      { label: t("landing.mock.post1"), n: "128", w: "100%", c: "#c74959", strong: true },
                      { label: t("landing.flow.exampleCsv"), n: "64", w: "52%", c: "#da6a78" },
                      { label: t("landing.flow.exampleSlack"), n: "39", w: "32%", c: "#e399a3" },
                    ].map((row) => (
                      <div key={row.label}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 600 }}>
                          <span>{row.label}</span>
                          <span style={{ color: row.strong ? "#c74959" : "rgba(28,10,12,.5)" }}>{row.n}</span>
                        </div>
                        <div style={{ marginTop: 3, height: 7, borderRadius: 4, background: "#fdeef0" }}>
                          <div style={{ width: row.w, height: "100%", borderRadius: 4, background: row.c }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ ...pill, position: "absolute", top: 352, left: 8, zIndex: 3, animation: "flf-floatY2 6.4s ease-in-out infinite .3s" }}>{t("landing.flow.demandVisible")}</div>
                <div style={{ position: "absolute", left: 96, bottom: 100, width: 110, height: 180 }}><Figure id="figB" w={110} h={180} style={{ animation: "flf-driftY 8.4s ease-in-out infinite .2s" }} /></div>
              </div>

              {/* ACT 3 — Your team triages */}
              <div className="flf-scene" style={{ position: "absolute", left: 614, top: 0, width: 300, height: 680, zIndex: 2, transitionDelay: ".21s" }}>
                <div style={{ position: "absolute", top: 44, left: 8, display: "inline-flex", alignItems: "center", gap: 9 }}>
                  <span style={numBadge}>03</span>
                  <span style={{ fontWeight: 700, fontSize: 17 }}>{t("landing.flow.triage.title")}</span>
                </div>
                <div style={{ ...card, position: "absolute", top: 84, left: 8, width: 252, padding: 14, animation: "flf-floatY 6.2s ease-in-out infinite .35s" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, fontWeight: 700, fontSize: 14 }}>
                      <Icon id="iconKanban" size={15} color="#c74959" />
                      {t("nav.roadmap")}
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", color: "rgba(28,10,12,.4)" }}>{t("landing.flow.now")}</span>
                  </div>
                  <div style={{ marginTop: 11, background: "#fdf8f9", border: "1px solid rgba(227,153,163,.3)", borderRadius: 12, padding: "9px 10px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{t("landing.mock.post1")}</span>
                      <span style={statusPill("#fef9c3", "#a16207")}>{t("status.in_progress")}</span>
                    </div>
                    <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                      {["ui", "theme"].map((tag) => (
                        <span key={tag} style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10, fontWeight: 600, color: "#c74959", background: "#fdf1f2", border: "1px solid rgba(227,153,163,.4)", borderRadius: 6, padding: "2px 6px" }}>
                          <Icon id="iconTag" size={10} />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div style={{ marginTop: 8, background: "#fdf8f9", border: "1px solid rgba(227,153,163,.3)", borderRadius: 12, padding: "9px 10px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{t("landing.flow.exampleSso")}</span>
                    <span style={statusPill("#f3e8ff", "#7e22ce")}>{t("status.planned")}</span>
                  </div>
                </div>
                <div style={{ position: "absolute", top: 296, left: 8, display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 999, background: "#c74959", color: "#fff", fontSize: 11, fontWeight: 600, boxShadow: "0 8px 20px -8px rgba(199,73,89,.5)", animation: "flf-floatY2 6s ease-in-out infinite .4s" }}>
                  <Icon id="iconSparkle" size={13} />
                  {t("landing.flow.boardUpdates")}
                </div>
                <div style={{ position: "absolute", left: 96, bottom: 150, width: 112, height: 182 }}><Figure id="figC" w={112} h={182} style={{ animation: "flf-driftY 8.8s ease-in-out infinite .5s" }} /></div>
              </div>

              {/* ACT 4 — You ship it */}
              <div className="flf-scene" style={{ position: "absolute", left: 916, top: 0, width: 300, height: 680, zIndex: 2, transitionDelay: ".3s" }}>
                <div style={{ position: "absolute", top: 156, left: 8, display: "inline-flex", alignItems: "center", gap: 9 }}>
                  <span style={numBadge}>04</span>
                  <span style={{ fontWeight: 700, fontSize: 17 }}>{t("landing.flow.ship.title")}</span>
                </div>
                <div style={{ ...card, position: "absolute", top: 196, left: 8, width: 250, padding: 14, animation: "flf-floatY 6.4s ease-in-out infinite .5s" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, color: "rgba(28,10,12,.5)", fontSize: 11, fontWeight: 600 }}>
                    <Icon id="iconSparkle" size={13} />
                    {t("nav.changelog")} · v2.4
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 9, fontSize: 15, fontWeight: 700 }}>
                    <Icon id="iconCheck" size={16} color="#15803d" />
                    {t("landing.mock.post1")}
                  </div>
                  <div style={{ marginTop: 5, fontSize: 12, color: "rgba(28,10,12,.55)", lineHeight: 1.45 }}>{t("landing.flow.nowLive")}</div>
                  <div style={{ marginTop: 11, display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 999, background: "#dcfce7", color: "#15803d" }}>
                    <Icon id="iconCheck" size={12} />
                    {t("status.completed")}
                  </div>
                </div>
                <div style={{ position: "absolute", left: 96, bottom: 140, width: 110, height: 180 }}><Figure id="figD" w={110} h={180} style={{ animation: "flf-driftY 9.2s ease-in-out infinite .3s" }} /></div>
              </div>

              {/* ACT 5 — Everyone hears back */}
              <div className="flf-scene" style={{ position: "absolute", left: 1218, top: 0, width: 300, height: 680, zIndex: 2, transitionDelay: ".39s" }}>
                <div style={{ position: "absolute", top: 44, left: 8, display: "inline-flex", alignItems: "center", gap: 9 }}>
                  <span style={numBadge}>05</span>
                  <span style={{ fontWeight: 700, fontSize: 17 }}>{t("landing.flow.hear.title")}</span>
                </div>
                <div style={{ ...card, position: "absolute", top: 84, left: 8, width: 250, padding: 14, boxShadow: "0 18px 40px -14px rgba(199,73,89,.3)", animation: "flf-floatY 6s ease-in-out infinite .55s" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: 10, background: "#fdf1f2", color: "#c74959", flexShrink: 0 }}>
                      <Icon id="iconMail" size={18} />
                    </span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{t("landing.flow.shippedTitle")}</div>
                      <div style={{ fontSize: 11, color: "rgba(28,10,12,.5)" }}>{t("landing.flow.shippedTo", { count: 43 })}</div>
                    </div>
                  </div>
                  <div style={{ marginTop: 11, fontSize: 12, color: "rgba(28,10,12,.6)", lineHeight: 1.45 }}>{t("landing.flow.shippedBody")}</div>
                </div>
                <div style={{ position: "absolute", top: 70, left: 224, display: "flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: "50%", background: "#c74959", color: "#fff", boxShadow: "0 8px 18px -6px rgba(199,73,89,.6)", animation: "flf-floatY2 5.6s ease-in-out infinite" }}>
                  <Icon id="iconBell" size={17} />
                </div>
                <div style={{ position: "absolute", left: 96, bottom: 290, width: 106, height: 172 }}><Figure id="figA" w={106} h={172} style={{ animation: "flf-driftY 8.2s ease-in-out infinite .6s" }} /></div>
              </div>

              {/* return-loop label */}
              <div style={{ position: "absolute", left: "50%", top: 594, transform: "translateX(-50%)", zIndex: 4, display: "flex", alignItems: "center", gap: 10, background: "linear-gradient(135deg,#c74959,#da6a78)", color: "#fff", padding: "11px 18px", borderRadius: 999, boxShadow: "0 16px 34px -12px rgba(199,73,89,.55)", whiteSpace: "nowrap" }}>
                <Icon id="iconLoop" size={18} />
                <span style={{ fontSize: 14, fontWeight: 600 }}>{t("landing.flow.loop")}</span>
              </div>
            </div>
          </div>

          {/* ── MOBILE: stacked timeline ─────────────────────────────── */}
          <div className="lg:hidden">
            <MobileTimeline t={t} />
          </div>
        </div>
      </div>
    </section>
  );
}

/** The five acts as a vertical, unscaled timeline for narrow screens. */
function MobileTimeline({ t }: { t: (k: string, o?: Record<string, unknown>) => string }) {
  const steps = [
    {
      num: "01",
      title: t("landing.flow.ask.title"),
      body: t("landing.flow.ask.body"),
      art: (
        <div style={{ display: "flex", alignItems: "flex-end", gap: 12 }}>
          <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
            <Figure id="figA" w={66} h={138} />
            <Figure id="figB" w={72} h={150} />
          </div>
          <MobileCard>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{t("landing.mock.post1")}</div>
                <div style={{ fontSize: 11, color: "rgba(28,10,12,.5)", marginTop: 2 }}>{t("landing.flow.featureRequest")}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", background: "#fdf1f2", border: "1px solid rgba(227,153,163,.5)", borderRadius: 11, padding: "6px 8px", color: "#c74959" }}>
                <Icon id="iconUp" size={14} />
                <span style={{ fontSize: 12, fontWeight: 700 }}>128</span>
              </div>
            </div>
          </MobileCard>
        </div>
      ),
    },
    {
      num: "02",
      title: t("landing.flow.vote.title"),
      body: t("landing.flow.vote.body"),
      art: (
        <div style={{ display: "flex", alignItems: "flex-end", gap: 12 }}>
          <Figure id="figB" w={78} h={156} />
          <MobileCard>
            <div style={{ display: "flex", alignItems: "center", gap: 7, fontWeight: 700, fontSize: 13 }}>
              <Icon id="iconTrend" size={14} />
              {t("landing.flow.mostWanted")}
            </div>
            {[
              { label: t("landing.mock.post1"), n: "128", w: "100%", c: "#c74959", strong: true },
              { label: t("landing.flow.exampleCsv"), n: "64", w: "52%", c: "#da6a78" },
            ].map((row) => (
              <div key={row.label} style={{ marginTop: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 600 }}>
                  <span>{row.label}</span>
                  <span style={{ color: row.strong ? "#c74959" : "rgba(28,10,12,.5)" }}>{row.n}</span>
                </div>
                <div style={{ marginTop: 3, height: 7, borderRadius: 4, background: "#fdeef0" }}>
                  <div style={{ width: row.w, height: "100%", borderRadius: 4, background: row.c }} />
                </div>
              </div>
            ))}
          </MobileCard>
        </div>
      ),
    },
    {
      num: "03",
      title: t("landing.flow.triage.title"),
      body: t("landing.flow.triage.body"),
      art: (
        <div style={{ display: "flex", alignItems: "flex-end", gap: 12 }}>
          <Figure id="figC" w={80} h={160} />
          <MobileCard>
            <div style={{ display: "flex", alignItems: "center", gap: 7, fontWeight: 700, fontSize: 13 }}>
              <Icon id="iconKanban" size={14} />
              {t("nav.roadmap")}
            </div>
            <div style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{t("landing.mock.post1")}</span>
              <span style={statusPill("#fef9c3", "#a16207")}>{t("status.in_progress")}</span>
            </div>
            <div style={{ marginTop: 8, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{t("landing.flow.exampleSso")}</span>
              <span style={statusPill("#f3e8ff", "#7e22ce")}>{t("status.planned")}</span>
            </div>
          </MobileCard>
        </div>
      ),
    },
    {
      num: "04",
      title: t("landing.flow.ship.title"),
      body: t("landing.flow.ship.body"),
      art: (
        <div style={{ display: "flex", alignItems: "flex-end", gap: 12 }}>
          <Figure id="figD" w={80} h={160} />
          <MobileCard>
            <div style={{ display: "flex", alignItems: "center", gap: 7, color: "rgba(28,10,12,.5)", fontSize: 11, fontWeight: 600 }}>
              <Icon id="iconSparkle" size={13} />
              {t("nav.changelog")} · v2.4
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 8, fontSize: 14, fontWeight: 700 }}>
              <span style={{ color: "#15803d", display: "flex" }}><Icon id="iconCheck" size={15} /></span>
              {t("landing.mock.post1")}
            </div>
            <div style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 999, background: "#dcfce7", color: "#15803d" }}>
              <Icon id="iconCheck" size={12} />
              {t("status.completed")}
            </div>
          </MobileCard>
        </div>
      ),
    },
    {
      num: "05",
      title: t("landing.flow.hear.title"),
      body: t("landing.flow.hear.body"),
      art: (
        <div style={{ display: "flex", alignItems: "flex-end", gap: 12 }}>
          <Figure id="figA" w={80} h={160} />
          <MobileCard>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: 9, background: "#fdf1f2", color: "#c74959", flexShrink: 0 }}>
                <Icon id="iconMail" size={16} />
              </span>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{t("landing.flow.shippedTitle")}</div>
            </div>
            <div style={{ marginTop: 10, fontSize: 12, color: "rgba(28,10,12,.6)", lineHeight: 1.45 }}>{t("landing.flow.shippedBody")}</div>
          </MobileCard>
        </div>
      ),
    },
  ];

  return (
    <div>
      {steps.map((s, i) => (
        <div key={s.num}>
          <div className="flf-scene" style={{ background: "#fff", border: "1px solid rgba(227,153,163,.4)", borderRadius: 24, boxShadow: "0 16px 40px -18px rgba(199,73,89,.25)", padding: "22px 20px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 9, marginBottom: 14 }}>
              <span style={numBadge}>{s.num}</span>
              <span style={{ fontWeight: 700, fontSize: 18 }}>{s.title}</span>
            </div>
            {s.art}
            <div style={{ marginTop: 14, fontSize: 14, color: "rgba(28,10,12,.62)", lineHeight: 1.5 }}>{s.body}</div>
          </div>
          {i < steps.length - 1 && (
            <div aria-hidden="true">
              <div style={{ display: "flex", justifyContent: "center", padding: "6px 0" }}>
                <div style={{ width: 2, height: 26, background: "repeating-linear-gradient(#e399a3 0 6px,transparent 6px 12px)" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "center", marginTop: -8, marginBottom: 2 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: "50%", background: "#fff", border: "1px solid rgba(227,153,163,.5)", color: "#c74959" }}>
                  <Icon id="iconDown" size={16} />
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
      <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 14, background: "linear-gradient(135deg,#c74959,#da6a78)", color: "#fff", borderRadius: 22, padding: "18px 20px", boxShadow: "0 18px 40px -16px rgba(199,73,89,.5)" }}>
        <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 44, height: 44, borderRadius: 13, background: "rgba(255,255,255,.18)", flexShrink: 0 }}>
          <Icon id="iconLoop" size={22} />
        </span>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{t("landing.flow.loopMobileTitle")}</div>
          <div style={{ fontSize: 13, opacity: 0.85, marginTop: 2 }}>{t("landing.flow.loopMobileSub")}</div>
        </div>
      </div>
    </div>
  );
}

function MobileCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ flex: 1, minWidth: 0, background: "#fdf8f9", border: "1px solid rgba(227,153,163,.4)", borderRadius: 16, padding: 13 }}>
      {children}
    </div>
  );
}

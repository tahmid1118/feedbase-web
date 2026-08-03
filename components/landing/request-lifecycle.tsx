"use client";

import { useEffect, useState } from "react";
import { ArrowUp, Check, Mail } from "lucide-react";

import { useTranslation } from "@/lib/i18n/client";

/**
 * The landing page's signature element: one feature request, followed all the
 * way through.
 *
 * The product's real argument is not "collect feedback" — every competitor does
 * that. It's that the person who asked finds out what happened. So the hero
 * shows a single request walking its own lifecycle (Open → Planned → In
 * Progress → Shipped), stamping a trail as it goes and ending on the email that
 * closes the loop. One orchestrated moment, rather than motion scattered over
 * the page.
 *
 * All copy comes from existing i18n keys, so this works in all 8 languages
 * without adding any.
 */

/** Stages in order. `statusKey` and `label` are existing, translated keys. */
const STAGES = [
  { key: "open", votes: 3, tone: "rose" },
  { key: "planned", votes: 41, tone: "rose" },
  { key: "in_progress", votes: 78, tone: "rose" },
  { key: "completed", votes: 78, tone: "sage" },
] as const;

const STAGE_MS = 900;
// How long to sit on "Shipped" before looping back to "Open" — long enough
// that the payoff (the email line below the card) is actually readable rather
// than flashing past on the way to a dead card.
const HOLD_MS = 2600;

/** Muted evergreen is the ONLY cool colour on the page — it marks "shipped". */
const TONE = {
  rose: { dot: "#c74959", text: "#8f2f3b", chip: "#c74959" },
  sage: { dot: "#2f6b53", text: "#2f6b53", chip: "#2f6b53" },
} as const;

export function RequestLifecycle() {
  const { t } = useTranslation();
  // Starts at "Open" and only ever moves forward within a cycle, so the
  // server-rendered frame is a coherent state rather than one that visibly
  // rewinds on hydration.
  const [stage, setStage] = useState(0);
  // Bumped each time the sequence loops back to "Open". The trail's stamps and
  // connectors (`lp-stamp-in` / `lp-thread`) are one-shot CSS animations that
  // only fire on mount, so keying the trail on `cycle` (see JSX below) forces
  // fresh DOM nodes each lap and the animation replays instead of sitting in
  // its finished state forever.
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    // Every setState below is inside a timer callback on purpose: the React
    // Compiler's `set-state-in-effect` rule rejects one called straight from an
    // effect body (same constraint as the support-chat pollers).
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // No motion, so jump to the resolved state — that's the one carrying the
      // meaning — and stay there. The CSS keyframes are already disabled by
      // the media query, so there's nothing to loop.
      const settle = setTimeout(() => setStage(STAGES.length - 1), 0);
      return () => clearTimeout(settle);
    }

    let live = true;
    let timer: ReturnType<typeof setTimeout>;

    const advance = (i: number) => {
      if (!live) return;
      setStage(i);
      timer = setTimeout(
        () => {
          if (!live) return;
          if (i < STAGES.length - 1) {
            advance(i + 1);
          } else {
            // Landed on "Shipped" and held there; loop back to a fresh "Open".
            setCycle((c) => c + 1);
            advance(0);
          }
        },
        i < STAGES.length - 1 ? STAGE_MS : HOLD_MS
      );
    };

    // Deferred, not called directly, for the same set-state-in-effect reason
    // as the reduced-motion branch above.
    timer = setTimeout(() => advance(0), 0);

    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, []);

  const active = STAGES[stage];
  const tone = TONE[active.tone];
  const shipped = stage === STAGES.length - 1;

  return (
    <figure className="relative m-0 w-full max-w-md">
      {/* A single sheet, lifted off the page. No blur blobs behind it: the
          artifact should read as a real object, not a glow. */}
      <div className="rounded-2xl border border-[#e399a3]/45 bg-white p-5 shadow-[0_24px_60px_-32px_rgba(28,10,12,0.45)] sm:p-6">
        <div className="flex items-start gap-4">
          {/* Vote tally. Mono numerals so the count changing doesn't reflow
              the row width. */}
          <div className="flex shrink-0 flex-col items-center gap-1 rounded-xl border border-[#e399a3]/50 px-3 py-2">
            <ArrowUp className="h-3.5 w-3.5" style={{ color: tone.chip }} />
            <span
              className="font-mono text-sm font-semibold tabular-nums transition-colors duration-300"
              style={{ color: tone.text }}
            >
              {active.votes}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="font-display text-lg leading-snug font-semibold text-[#1c0a0c]">
              {t("landing.mock.post1")}
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-[#1c0a0c]/60">
              {t("landing.flow.darkModeSub")}
            </p>

            <span
              className="mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[11px] tracking-wide uppercase transition-colors duration-300"
              style={{ backgroundColor: `${tone.chip}14`, color: tone.text }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: tone.dot }}
              />
              {t(`status.${active.key}`)}
            </span>
          </div>
        </div>

        {/* The trail. This is the point of the whole component: the history is
            visible, so the person who asked can see it moved.
            key={cycle}: forces a remount each lap so the one-shot stamp/thread
            animations replay — see the effect above. */}
        <ol key={cycle} className="mt-5 border-t border-[#e399a3]/30 pt-4">
          {STAGES.map((s, i) => {
            const done = i <= stage;
            const isLast = i === STAGES.length - 1;
            const stageTone = TONE[s.tone];

            return (
              <li key={s.key} className="relative flex gap-3 pb-3 last:pb-0">
                {/* Connector, drawn only between landed stamps. */}
                {!isLast && (
                  <span
                    aria-hidden
                    className="lp-thread absolute top-4 left-[7px] w-px"
                    style={{
                      height: "calc(100% - 0.5rem)",
                      backgroundColor: done ? "#e399a3" : "#f0dfe2",
                      animationDelay: `${i * STAGE_MS}ms`,
                    }}
                  />
                )}

                <span
                  className="lp-stamp-in relative z-10 mt-0.5 flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-full border-2 bg-white transition-colors duration-300"
                  style={{
                    borderColor: done ? stageTone.dot : "#f0dfe2",
                    animationDelay: `${i * STAGE_MS}ms`,
                  }}
                >
                  {done && (
                    <Check
                      className="h-2 w-2"
                      strokeWidth={4}
                      style={{ color: stageTone.dot }}
                    />
                  )}
                </span>

                <span
                  className="font-mono text-[11px] tracking-wide uppercase transition-colors duration-300"
                  style={{ color: done ? "#1c0a0c99" : "#1c0a0c33" }}
                >
                  {t(`status.${s.key}`)}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      {/* The payoff, and the thing no competitor puts on their landing page:
          the loop actually closes. Held in the layout at all times so the card
          doesn't jump height when it appears. */}
      <figcaption
        className={`mt-3 flex items-center gap-2.5 rounded-xl border border-[#2f6b53]/25 bg-[#2f6b53]/[0.06] px-4 py-3 transition-opacity duration-500 ${
          shipped ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden={!shipped}
      >
        <Mail className="h-4 w-4 shrink-0 text-[#2f6b53]" />
        <span className="text-sm text-[#1c0a0c]/75">
          <span className="font-semibold text-[#2f6b53]">
            {t("landing.flow.shippedTitle")}
          </span>{" "}
          {t("landing.flow.shippedTo", { count: 78 })}
        </span>
      </figcaption>
    </figure>
  );
}

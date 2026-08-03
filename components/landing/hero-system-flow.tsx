"use client";

import { useEffect, useState } from "react";
import { ArrowUp, GitBranch, Mail, MessageSquarePlus, TrendingUp } from "lucide-react";

import { useTranslation } from "@/lib/i18n/client";

/**
 * Hero-scaled version of "how it works" (compare against FeedbackLoopFlow,
 * the full "How it works" section further down the page): four stage cards
 * — ask, vote, ship, hear back — building up top to bottom and looping,
 * instead of one request's internal status stepper (RequestLifecycle, the
 * component this replaces in the hero).
 *
 * Reuses RequestLifecycle's own loop timer shape (STAGE_MS/HOLD_MS,
 * setTimeout-chained advance()) and its `lp-stamp-in`/`lp-thread` CSS
 * (globals.css) for the badge-and-connector reveal — same visual grammar,
 * exploded from one card's internal trail into four standalone cards so the
 * SYSTEM is what's visible, not just one item's history.
 *
 * All copy is existing i18n keys (borrowed from feedback-loop-flow's own
 * strings), so this needs no new translations across the 8 locales.
 */

const STAGE_MS = 900;
const HOLD_MS = 2600;

const STEPS = [
  { key: "ask", icon: MessageSquarePlus, votes: 3, tone: "rose" },
  { key: "vote", icon: TrendingUp, votes: 41, tone: "rose" },
  { key: "ship", icon: GitBranch, votes: 78, tone: "sage" },
  { key: "hear", icon: Mail, votes: 78, tone: "sage" },
] as const;

/** Muted evergreen is the ONLY cool colour on the page — it marks "shipped",
    same rule as RequestLifecycle, just now spanning the last two stages
    (build lands, then the submitter hears about it) rather than one. */
const TONE = {
  rose: { ring: "#c74959", dim: "#f0dfe2", chipBg: "#fdf1f2", chipFg: "#c74959" },
  sage: { ring: "#2f6b53", dim: "#f0dfe2", chipBg: "#eaf3ee", chipFg: "#2f6b53" },
} as const;

export function HeroSystemFlow() {
  const { t } = useTranslation();
  const [stage, setStage] = useState(0);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const settle = setTimeout(() => setStage(STEPS.length - 1), 0);
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
          if (i < STEPS.length - 1) {
            advance(i + 1);
          } else {
            setCycle((c) => c + 1);
            advance(0);
          }
        },
        i < STEPS.length - 1 ? STAGE_MS : HOLD_MS
      );
    };

    timer = setTimeout(() => advance(0), 0);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="w-full max-w-md">
      <ol key={cycle} className="m-0 list-none p-0">
        {STEPS.map((s, i) => {
          const done = i <= stage;
          const isLast = i === STEPS.length - 1;
          const tone = TONE[s.tone];
          const Icon = s.icon;

          const title =
            s.key === "hear" ? t("landing.flow.shippedTitle") : t("landing.mock.post1");
          const showVotes = s.key === "ask" || s.key === "vote";

          return (
            <li key={s.key} className="relative flex gap-4 pb-7 last:pb-0">
              {!isLast && (
                <span
                  aria-hidden
                  className="lp-thread absolute top-8 left-[15px] w-px"
                  style={{
                    height: "calc(100% - 0.5rem)",
                    backgroundColor: done ? "#e399a3" : tone.dim,
                    animationDelay: `${i * STAGE_MS}ms`,
                  }}
                />
              )}

              <span
                className="lp-stamp-in relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 bg-white transition-colors duration-300"
                style={{
                  borderColor: done ? tone.ring : tone.dim,
                  animationDelay: `${i * STAGE_MS}ms`,
                }}
              >
                <Icon
                  className="h-4 w-4 transition-colors duration-300"
                  style={{ color: done ? tone.ring : tone.dim }}
                />
              </span>

              <div
                className={`min-w-0 flex-1 rounded-xl border border-[#e399a3]/40 bg-white px-4 py-3 shadow-[0_10px_26px_-16px_rgba(199,73,89,0.35)] transition-all duration-500 ${
                  done ? "opacity-100" : "translate-y-2 opacity-0"
                }`}
              >
                <div
                  className="font-mono text-[10px] font-medium tracking-[0.14em] uppercase"
                  style={{ color: tone.ring }}
                >
                  {t(`landing.flow.${s.key}.title`)}
                </div>
                <div className="mt-1 truncate text-sm font-semibold text-[#1c0a0c]">
                  {title}
                </div>
                <span
                  className="mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[11px] font-semibold tabular-nums"
                  style={{ backgroundColor: tone.chipBg, color: tone.chipFg }}
                >
                  {showVotes && <ArrowUp className="h-2.5 w-2.5" />}
                  {s.key === "hear"
                    ? t("landing.flow.shippedTo", { count: s.votes })
                    : s.key === "ship"
                      ? t("status.completed")
                      : s.votes}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

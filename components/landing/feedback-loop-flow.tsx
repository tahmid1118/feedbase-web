import {
  ArrowDown,
  ArrowRight,
  GitBranch,
  Megaphone,
  MessageSquare,
  RefreshCw,
  ThumbsUp,
} from "lucide-react";
import { getTranslation } from "@/lib/i18n/server";

/**
 * "How it works", drawn as the actual feedback LOOP rather than a list of setup
 * steps — the loop is the product, and a closed circle communicates the value
 * (users are heard, and hear back) in a way four stacked cards never did.
 *
 * Each stage carries a miniature scenario card following ONE piece of feedback
 * ("Add dark mode", the same example used in the hero) from submission to
 * release, so the diagram tells a concrete story instead of listing abstractions.
 *
 * Responsive by construction: a horizontal rail with arrow connectors on wide
 * screens, collapsing to a vertical timeline below `xl` — the connectors swap
 * direction rather than disappearing, so the sense of flow survives on mobile.
 */
export async function FeedbackLoopFlow() {
  const { t } = await getTranslation();

  const stages = [
    {
      key: "collect",
      icon: MessageSquare,
      // Alternating brand tones give the rail rhythm without new colours.
      tone: "bg-[#c74959]",
      ring: "ring-[#c74959]/20",
      chip: (
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#e399a3]/40 bg-white px-2.5 py-1.5 text-xs font-medium text-[#1c0a0c] shadow-sm">
          <span>💬</span>
          <span className="truncate">{t("landing.mock.post1")}</span>
        </span>
      ),
    },
    {
      key: "prioritize",
      icon: ThumbsUp,
      tone: "bg-[#da6a78]",
      ring: "ring-[#da6a78]/20",
      chip: (
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#e399a3]/40 bg-white px-2.5 py-1.5 text-xs font-semibold text-[#c74959] shadow-sm">
          <ThumbsUp className="h-3.5 w-3.5" />
          128
          <span className="font-normal text-[#1c0a0c]/50">
            {t("landing.flow.votes")}
          </span>
        </span>
      ),
    },
    {
      key: "build",
      icon: GitBranch,
      tone: "bg-[#c74959]",
      ring: "ring-[#c74959]/20",
      chip: (
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#e399a3]/40 bg-white px-2.5 py-1.5 text-xs shadow-sm">
          <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-medium text-yellow-700">
            {t("status.in_progress")}
          </span>
        </span>
      ),
    },
    {
      key: "announce",
      icon: Megaphone,
      tone: "bg-[#da6a78]",
      ring: "ring-[#da6a78]/20",
      chip: (
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#e399a3]/40 bg-white px-2.5 py-1.5 text-xs shadow-sm">
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
            {t("status.completed")}
          </span>
          <span className="text-[#1c0a0c]/50">{t("landing.flow.shipped")}</span>
        </span>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      {/* The rail. flex-col below xl (vertical timeline), flex-row above. */}
      <div className="flex flex-col items-stretch gap-3 xl:flex-row xl:items-stretch xl:gap-2">
        {stages.map((stage, i) => (
          <div
            key={stage.key}
            className="flex flex-col items-stretch gap-3 xl:flex-1 xl:flex-row xl:items-center"
          >
            {/* Stage card */}
            <div className="group relative flex-1 rounded-2xl border border-[#e399a3]/25 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-[#c74959]/40 hover:shadow-lg hover:shadow-[#c74959]/5">
              <div className="mb-3 flex items-center gap-3">
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white ring-4 ${stage.tone} ${stage.ring}`}
                >
                  <stage.icon className="h-5 w-5" />
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#c74959]/70">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>

              <h3 className="mb-1.5 text-lg font-semibold text-[#1c0a0c]">
                {t(`landing.flow.${stage.key}.title`)}
              </h3>
              <p className="mb-4 text-sm leading-relaxed text-[#1c0a0c]/70">
                {t(`landing.flow.${stage.key}.desc`)}
              </p>

              {/* Scenario: the same request, at this point in the pipeline. */}
              <div className="rounded-xl border border-dashed border-[#e399a3]/50 bg-[#fdf8f9] p-2.5">
                {stage.chip}
              </div>
            </div>

            {/* Connector to the next stage. Hidden after the last one. */}
            {i < stages.length - 1 && (
              <div
                aria-hidden
                className="flex items-center justify-center xl:w-8 xl:shrink-0"
              >
                {/* vertical on narrow screens */}
                <ArrowDown className="h-5 w-5 text-[#e399a3] xl:hidden" />
                {/* horizontal on wide screens */}
                <ArrowRight className="hidden h-5 w-5 text-[#e399a3] xl:block" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Loop-back: what makes this a cycle rather than a funnel. */}
      <div className="mt-6 flex justify-center">
        <span className="inline-flex items-center gap-2.5 rounded-full border border-[#c74959]/25 bg-gradient-to-r from-[#c74959]/10 to-[#da6a78]/10 px-5 py-2.5 text-sm font-medium text-[#c74959]">
          <RefreshCw className="h-4 w-4" />
          {t("landing.flow.loop")}
        </span>
      </div>
    </div>
  );
}

import {
  ArrowRight,
  Bell,
  GitBranch,
  MessageSquare,
  RefreshCw,
  Rocket,
  ThumbsUp,
} from "lucide-react";
import { getTranslation } from "@/lib/i18n/server";
import { FlatPerson, TONES, type PersonTone } from "@/components/landing/flat-person";

/**
 * Explicit shape for a figure in a scene. Without it TypeScript infers a union
 * of the differing object literals below and `armRaised` is missing on some
 * branches.
 */
type ScenePerson = {
  tone: PersonTone;
  longHair?: boolean;
  armRaised?: boolean;
};

/**
 * "How it works" as a flat-design process infographic: illustrated actors, icon
 * cards, connectors and stat bars — the format of a printed infographic rather
 * than a list of feature bullets.
 *
 * It reads as a LOOP, not a funnel, because that is the product: users are
 * heard, and then hear back. The three scenes are the three parties in that
 * loop, and the ribbon underneath closes it.
 *
 * Every number shown is derived from the illustrative example board rendered
 * beside it — nothing here is a market statistic or a usage claim.
 */
export async function FeedbackLoopFlow() {
  const { t } = await getTranslation();

  /**
   * Illustrative mix on the sample board. Labelled as an example in the UI so
   * it can't be read as a real-world statistic.
   */
  const mix = [
    { key: "type.feature_request", pct: 55, color: "#c74959", emoji: "✨" },
    { key: "type.bug_report", pct: 30, color: "#da6a78", emoji: "🐛" },
    { key: "type.feedback", pct: 15, color: "#e399a3", emoji: "💬" },
  ];

  const scenes = [
    {
      key: "collect",
      icon: MessageSquare,
      accent: "#c74959",
      people: [
        { tone: TONES.rose, longHair: true, armRaised: true },
        { tone: TONES.sand },
      ] as ScenePerson[],
      // The artefact this actor produces, shown as a small floating card.
      card: (
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-[#e399a3]/50 bg-white px-2.5 py-1.5 text-xs font-medium text-[#1c0a0c] shadow-md">
          <span>💬</span>
          {t("landing.mock.post1")}
        </span>
      ),
      badge: (
        <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-[#c74959] px-2.5 py-1 text-[11px] font-bold text-white shadow-md">
          <ThumbsUp className="h-3 w-3" />
          128
        </span>
      ),
    },
    {
      key: "build",
      icon: GitBranch,
      accent: "#da6a78",
      people: [{ tone: TONES.deep }, { tone: TONES.blush, longHair: true }] as ScenePerson[],
      card: (
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-[#e399a3]/50 bg-white px-2.5 py-1.5 text-xs shadow-md">
          <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-medium text-yellow-700">
            {t("status.in_progress")}
          </span>
        </span>
      ),
      badge: (
        <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-[#da6a78] px-2.5 py-1 text-[11px] font-bold text-white shadow-md">
          <Rocket className="h-3 w-3" />
          {t("status.planned")}
        </span>
      ),
    },
    {
      key: "announce",
      icon: Bell,
      accent: "#c74959",
      people: [
        { tone: TONES.blush, armRaised: true },
        { tone: TONES.rose, longHair: true },
      ] as ScenePerson[],
      card: (
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-[#e399a3]/50 bg-white px-2.5 py-1.5 text-xs shadow-md">
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
            {t("status.completed")}
          </span>
        </span>
      ),
      badge: (
        <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-[#c74959] px-2.5 py-1 text-[11px] font-bold text-white shadow-md">
          <Bell className="h-3 w-3" />
          {t("landing.info.notified")}
        </span>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      {/* ── Top panel: what a board actually contains ────────────────── */}
      <div className="mx-auto mb-4 max-w-3xl rounded-2xl border border-[#e399a3]/30 bg-white/80 p-5 shadow-sm backdrop-blur-sm">
        <p className="mb-4 text-center text-[11px] font-bold uppercase tracking-[0.15em] text-[#c74959]/70">
          {t("landing.info.exampleBoard")}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-6">
          {mix.map((m) => (
            <div key={m.key} className="flex-1">
              <div className="mb-1.5 flex items-baseline justify-between gap-2">
                <span className="flex items-center gap-1.5 text-sm font-medium text-[#1c0a0c]">
                  <span>{m.emoji}</span>
                  {t(m.key)}
                </span>
                <span className="text-lg font-bold" style={{ color: m.color }}>
                  {m.pct}%
                </span>
              </div>
              {/* Bar track + fill, mirroring the printed-infographic look. */}
              <div className="h-2.5 overflow-hidden rounded-full bg-[#e399a3]/20">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${m.pct}%`, backgroundColor: m.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stem connecting the panel down into the scenes. */}
      <div aria-hidden className="flex justify-center">
        <div className="h-8 w-px bg-gradient-to-b from-[#e399a3]/60 to-[#e399a3]/20" />
      </div>

      {/* ── Middle: the three actors in the loop ─────────────────────── */}
      <div className="flex flex-col items-stretch gap-4 lg:flex-row lg:items-stretch lg:gap-3">
        {scenes.map((scene, i) => (
          <div
            key={scene.key}
            className="flex flex-col items-stretch gap-4 lg:flex-1 lg:flex-row lg:items-center lg:gap-3"
          >
            <div className="group relative flex-1 overflow-hidden rounded-3xl border border-[#e399a3]/30 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-[#c74959]/40 hover:shadow-xl hover:shadow-[#c74959]/5">
              {/* Tinted stage backdrop behind the figures. */}
              <div
                aria-hidden
                className="absolute inset-x-0 top-0 h-40 opacity-[0.07]"
                style={{
                  background: `radial-gradient(120% 80% at 50% 0%, ${scene.accent}, transparent 70%)`,
                }}
              />

              {/* Illustration stage */}
              <div className="relative mb-5 flex h-44 items-end justify-center gap-1">
                {/* floating artefact card, top-left of the scene */}
                <div className="absolute left-0 top-1 z-10">{scene.card}</div>
                {/* metric badge, top-right */}
                <div className="absolute right-0 top-8 z-10">{scene.badge}</div>

                {scene.people.map((p, idx) => (
                  <FlatPerson
                    key={idx}
                    tone={p.tone}
                    longHair={p.longHair}
                    armRaised={p.armRaised}
                    // Slight size/offset variation stops the pair looking cloned.
                    className={
                      idx === 0
                        ? "h-40 w-auto drop-shadow-sm"
                        : "h-36 w-auto -ml-3 drop-shadow-sm"
                    }
                  />
                ))}

                {/* Ground line the figures stand on. */}
                <div
                  aria-hidden
                  className="absolute bottom-0 h-px w-32 bg-gradient-to-r from-transparent via-[#e399a3]/50 to-transparent"
                />
              </div>

              {/* Caption */}
              <div className="relative">
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-white"
                    style={{ backgroundColor: scene.accent }}
                  >
                    <scene.icon className="h-4 w-4" />
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#c74959]/60">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="mb-1.5 text-lg font-semibold text-[#1c0a0c]">
                  {t(`landing.flow.${scene.key}.title`)}
                </h3>
                <p className="text-sm leading-relaxed text-[#1c0a0c]/70">
                  {t(`landing.flow.${scene.key}.desc`)}
                </p>
              </div>
            </div>

            {/* Connector between scenes, with a label like a printed infographic. */}
            {i < scenes.length - 1 && (
              <div
                aria-hidden
                className="flex shrink-0 items-center justify-center lg:w-24 lg:flex-col lg:gap-1.5"
              >
                <span className="hidden text-[10px] font-semibold uppercase tracking-wider text-[#c74959]/60 lg:block">
                  {t(`landing.info.link${i + 1}`)}
                </span>
                <div className="flex items-center">
                  {/* dashed rail + arrowhead */}
                  <span className="hidden h-px w-10 bg-[repeating-linear-gradient(90deg,#e399a3_0,#e399a3_5px,transparent_5px,transparent_10px)] lg:block" />
                  <ArrowRight className="h-5 w-5 rotate-90 text-[#e399a3] lg:rotate-0" />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Bottom ribbon: closes the loop ───────────────────────────── */}
      <div className="mt-6 flex flex-col items-center gap-3">
        <div className="flex w-full max-w-3xl items-center gap-3">
          <span aria-hidden className="h-px flex-1 bg-gradient-to-r from-transparent to-[#e399a3]/60" />
          <span className="inline-flex items-center gap-2.5 rounded-full border border-[#c74959]/25 bg-gradient-to-r from-[#c74959]/10 to-[#da6a78]/10 px-5 py-2.5 text-sm font-medium text-[#c74959]">
            <RefreshCw className="h-4 w-4" />
            {t("landing.flow.loop")}
          </span>
          <span aria-hidden className="h-px flex-1 bg-gradient-to-l from-transparent to-[#e399a3]/60" />
        </div>
      </div>
    </div>
  );
}

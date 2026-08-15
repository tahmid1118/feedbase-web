/**
 * Landing-page FAQ.
 *
 * There is a /faq route already, and almost nobody reaches it — the audit
 * found 3 visitors on it in 30 days. Objections have to be answered at the
 * point of decision, not on a page a visitor would have to go looking for, so
 * the six questions that actually block a signup live inline here, directly
 * above the closing CTA.
 *
 * Native <details>/<summary> rather than a JS accordion: it is keyboard
 * accessible and open-by-default-on-print for free, needs no client bundle,
 * and this section is deep enough down the page that hydration cost buys
 * nothing. The first item is open because it answers the objection the hero
 * creates, and a fully collapsed FAQ reads as having nothing to say.
 */
import { Plus } from "@/components/icons";

const KEYS = ["spam", "signin", "free", "domain", "export", "after"] as const;

export function LandingFaq({ t }: { t: (key: string) => string }) {
  return (
    <section className="mx-auto max-w-3xl px-5 py-20 lg:px-8 lg:py-24">
      <h2 className="font-display text-4xl leading-tight font-semibold text-balance text-[#1c0a0c] lg:text-5xl">
        {t("landing.faq.heading")}
      </h2>

      <div className="mt-10 divide-y divide-[#1c0a0c]/10 border-y border-[#1c0a0c]/10">
        {KEYS.map((k, i) => (
          <details key={k} open={i === 0} className="group">
            <summary className="flex cursor-pointer list-none items-start justify-between gap-4 py-5 text-left [&::-webkit-details-marker]:hidden">
              <span className="text-[17px] leading-snug font-semibold text-[#1c0a0c]">
                {t(`landing.faq.${k}Q`)}
              </span>
              {/* Rotates to an "×" when open. transform only, so it is cheap
                  and respects reduced-motion via the global rule. */}
              <Plus
                className="mt-0.5 h-5 w-5 shrink-0 text-[#c74959] transition-transform duration-200 group-open:rotate-45"
                strokeWidth={1.75}
                aria-hidden
              />
            </summary>
            <p className="pb-6 text-[15px] leading-relaxed text-[#1c0a0c]/65">
              {t(`landing.faq.${k}A`)}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}

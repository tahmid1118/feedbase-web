"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { PLANS, planPricing, formatPrice } from "@/lib/plans";
import type { OfferMap, BillingInterval } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { IntervalToggle } from "@/components/pricing/interval-toggle";
import { useTranslation } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

/**
 * Public, display-only pricing cards with a Monthly/Yearly toggle. Yearly shows
 * the ~20%-cheaper per-month-equivalent price; an admin promotional offer (if
 * any) applies to the MONTHLY price only. No payment here — CTAs route to signup.
 */
export function PricingCards({
  offers,
  ctaHref = "/signup",
}: {
  offers: OfferMap;
  ctaHref?: string;
}) {
  const { t } = useTranslation();
  const [interval, setInterval] = useState<BillingInterval>("month");

  // A yearly offer replaces the flat 20% yearly saving for that plan, so hide
  // the toggle's generic "Save 20%" badge when any yearly offer is active.
  const hasYearlyOffer = Object.values(offers).some((o) => o?.year);

  return (
    <div className="space-y-8">
      <div className="flex justify-center">
        <IntervalToggle value={interval} onChange={setInterval} showSave={!hasYearlyOffer} />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {PLANS.map((plan) => {
          const offer = offers[plan.key]?.[interval];
          const pricing = planPricing(plan, interval);
          const showYearly = interval === "year" && plan.monthlyPrice > 0;
          return (
            <div
              key={plan.key}
              className={cn(
                "flex flex-col rounded-2xl border bg-white p-6 transition-all",
                plan.highlighted
                  ? "border-[#c74959] shadow-lg ring-2 ring-[#c74959]/30"
                  : "border-[#e399a3]/20 hover:border-[#c74959]/40 hover:shadow-lg"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-semibold text-[#1c0a0c]">
                    {plan.name}
                  </h3>
                  {offer ? (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-bold text-green-700">
                      SAVE {offer.percentOff}%
                    </span>
                  ) : showYearly ? (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-bold text-green-700">
                      SAVE {pricing.savingsPercent}%
                    </span>
                  ) : null}
                </div>
                {plan.highlighted && !offer && !showYearly && (
                  <span className="rounded-full bg-[#c74959]/10 px-3 py-1 text-xs font-medium text-[#c74959]">
                    {t("billing.recommended")}
                  </span>
                )}
              </div>

              <div className="mt-3">
                {offer ? (
                  <div className="flex items-baseline gap-2">
                    <span
                      className="text-2xl font-bold text-[#1c0a0c]/40"
                      style={{
                        backgroundImage:
                          "linear-gradient(to top right, transparent calc(50% - 1px), #c74959 calc(50% - 1px), #c74959 calc(50% + 1px), transparent calc(50% + 1px))",
                      }}
                    >
                      {formatPrice(offer.originalPrice)}
                    </span>
                    <span className="text-4xl font-bold text-green-600">
                      {formatPrice(offer.offerPrice)}
                    </span>
                    <span className="text-[#1c0a0c]/50">
                      {interval === "year" ? "/yr" : "/mo"}
                    </span>
                  </div>
                ) : (
                  <>
                    <span className="text-4xl font-bold text-[#1c0a0c]">
                      {pricing.perMonthLabel}
                    </span>
                    <span className="text-[#1c0a0c]/50">{pricing.suffix}</span>
                  </>
                )}
                {offer ? (
                  <>
                    {interval === "year" ? (
                      <p className="mt-1 text-xs text-[#1c0a0c]/50">
                        {t("pricing.perMoBilledAnnually", { price: formatPrice(offer.offerPrice / 12) })}
                      </p>
                    ) : null}
                    {offer.label || offer.endsAt ? (
                      <p className="mt-1 text-xs font-medium text-green-700">
                        {offer.label || t("pricing.limitedOffer")}
                        {offer.endsAt
                          ? ` · ${t("pricing.ends", { date: new Date(offer.endsAt).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" }) })}`
                          : ""}
                      </p>
                    ) : null}
                  </>
                ) : (
                  <p className="mt-1 text-xs text-[#1c0a0c]/50">
                    {t(pricing.billedNoteKey, pricing.billedNoteParams)}
                  </p>
                )}
              </div>
              <p className="mt-2 text-sm text-[#1c0a0c]/60">{t(plan.blurbKey)}</p>

              <ul className="mt-5 flex-1 space-y-2.5 text-sm text-[#1c0a0c]/80">
                {plan.featureKeys.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#c74959]" />
                    {t(f)}
                  </li>
                ))}
              </ul>

              <Link href={ctaHref} className="mt-6 block">
                <Button
                  className={cn(
                    "w-full",
                    plan.highlighted
                      ? "bg-[#c74959] text-white hover:bg-[#b03f4d]"
                      : "border border-[#c74959] bg-transparent text-[#c74959] hover:bg-[#c74959] hover:text-white"
                  )}
                >
                  {plan.key === "free" ? t("pricing.getStartedFree") : t("pricing.choose", { plan: plan.name })}
                </Button>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import Link from "next/link";
import { Check } from "lucide-react";
import { PLANS } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Public, display-only pricing cards (no payment here — CTAs route to signup;
 * checkout happens in the dashboard after login). Reused on the landing page
 * and the dedicated /pricing page.
 */
export function PricingSection({
  ctaHref = "/signup",
}: {
  ctaHref?: string;
}) {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {PLANS.map((plan) => (
        <div
          key={plan.key}
          className={cn(
            "flex flex-col rounded-2xl border bg-white p-6 transition-all",
            plan.highlighted
              ? "border-[#c74959] shadow-lg ring-2 ring-[#c74959]/30"
              : "border-[#e399a3]/20 hover:border-[#c74959]/40 hover:shadow-lg"
          )}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-[#1c0a0c]">{plan.name}</h3>
            {plan.highlighted && (
              <span className="rounded-full bg-[#c74959]/10 px-3 py-1 text-xs font-medium text-[#c74959]">
                Recommended
              </span>
            )}
          </div>

          <div className="mt-3">
            <span className="text-4xl font-bold text-[#1c0a0c]">
              {plan.priceLabel}
            </span>
            <span className="text-[#1c0a0c]/50">{plan.priceSuffix}</span>
          </div>
          <p className="mt-2 text-sm text-[#1c0a0c]/60">{plan.blurb}</p>

          <ul className="mt-5 flex-1 space-y-2.5 text-sm text-[#1c0a0c]/80">
            {plan.features.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#c74959]" />
                {f}
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
              {plan.key === "free" ? "Get started free" : `Choose ${plan.name}`}
            </Button>
          </Link>
        </div>
      ))}
    </div>
  );
}

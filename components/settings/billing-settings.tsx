"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Check, Loader2 } from "lucide-react";
import {
  billingApi,
  type BillingInterval,
  type BillingStatus,
  type PlanKey,
} from "@/lib/api";
import { PLANS, planPricing } from "@/lib/plans";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { IntervalToggle } from "@/components/pricing/interval-toggle";
import { toast } from "sonner";

const STATUS_LABEL: Record<string, string> = {
  active: "Active",
  trialing: "Trial",
  past_due: "Past due",
  canceled: "Canceled",
  incomplete: "Incomplete",
  unpaid: "Unpaid",
  comped: "Active",
};

export function BillingSettings() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const params = useSearchParams();

  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [interval, setInterval] = useState<BillingInterval>("month");
  const [busy, setBusy] = useState<string | null>(null); // plan key or "portal"
  const [promoInput, setPromoInput] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  // A redeemed percent-off code, applied on the next checkout.
  const [discount, setDiscount] = useState<{
    promotionCode?: string;
    percentOff?: number;
    appliesToPlan?: string;
  } | null>(null);

  const load = useCallback(() => {
    if (!token) return;
    billingApi
      .getStatus(token)
      .then((res) => setStatus(res.data ?? null))
      .catch(() => toast.error("Failed to load billing info"))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  // Toast on return from Stripe Checkout (?checkout=success|cancelled).
  useEffect(() => {
    const c = params.get("checkout");
    if (c === "success") toast.success("Subscription updated — welcome aboard!");
    else if (c === "cancelled") toast("Checkout cancelled.");
  }, [params]);

  const upgrade = async (plan: PlanKey) => {
    if (!token) return;
    setBusy(plan);
    try {
      const res = await billingApi.checkout(plan, token, {
        interval,
        promotionCode: discount?.promotionCode,
      });
      if (res.data?.url) window.location.assign(res.data.url);
      else toast.error("Could not start checkout");
    } catch (e) {
      toast.error((e as Error)?.message || "Could not start checkout");
    } finally {
      setBusy(null);
    }
  };

  const redeem = async () => {
    if (!token || !promoInput.trim()) return;
    setRedeeming(true);
    try {
      const res = await billingApi.redeem(promoInput.trim(), token);
      const d = res.data;
      if (d?.type === "free_plan") {
        toast.success(`Applied — your workspace is now on ${d.plan}.`);
        setPromoInput("");
        load();
      } else if (d?.type === "percent_off") {
        setDiscount({
          promotionCode: d.promotionCode,
          percentOff: d.percentOff,
          appliesToPlan: d.appliesToPlan,
        });
        setPromoInput("");
        toast.success(`${d.percentOff}% off will be applied when you check out.`);
      }
    } catch (e) {
      toast.error((e as Error)?.message || "That promo code is not valid.");
    } finally {
      setRedeeming(false);
    }
  };

  const manage = async () => {
    if (!token) return;
    setBusy("portal");
    try {
      const res = await billingApi.portal(token);
      if (res.data?.url) window.location.assign(res.data.url);
      else toast.error("Could not open billing portal");
    } catch (e) {
      toast.error((e as Error)?.message || "Could not open billing portal");
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="py-8 text-center text-[#1c0a0c]/60">Loading billing…</div>
      </Card>
    );
  }

  const current: PlanKey = status?.planName ?? "free";
  const hasSub = status?.hasSubscription ?? false;
  const currentPlan = PLANS.find((p) => p.key === current);
  const renewal = status?.currentPeriodEnd
    ? new Date(status.currentPeriodEnd).toLocaleDateString()
    : null;

  const manageButton = (
    <Button
      variant="outline"
      className="w-full"
      onClick={manage}
      disabled={busy !== null}
    >
      {busy === "portal" ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        "Manage billing"
      )}
    </Button>
  );

  const renderCta = (planKey: PlanKey, planName: string) => {
    if (planKey === current) {
      return (
        <Button variant="outline" disabled className="w-full">
          Current plan
        </Button>
      );
    }
    if (planKey === "free") {
      return hasSub ? (
        manageButton
      ) : (
        <Button variant="outline" disabled className="w-full">
          Included
        </Button>
      );
    }
    // Paid plan, not current: subscribers change tiers via the Stripe portal;
    // free users start a fresh Checkout.
    if (hasSub) return manageButton;
    return (
      <Button
        className="w-full bg-[#c74959] text-white hover:bg-[#b03f4d]"
        onClick={() => upgrade(planKey)}
        disabled={busy !== null}
      >
        {busy === planKey ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          `Upgrade to ${planName}`
        )}
      </Button>
    );
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-[#1c0a0c]/60">Current plan</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-xl font-bold text-[#1c0a0c]">
                {currentPlan?.name ?? "Free"}
              </span>
              {status?.subscriptionStatus && (
                <Badge variant="outline">
                  {STATUS_LABEL[status.subscriptionStatus] ??
                    status.subscriptionStatus}
                </Badge>
              )}
            </div>
            {hasSub && (renewal || status?.billingInterval) && (
              <p className="mt-1 text-xs text-[#1c0a0c]/50">
                {status?.billingInterval === "year"
                  ? "Billed yearly"
                  : status?.billingInterval === "month"
                    ? "Billed monthly"
                    : null}
                {status?.billingInterval && renewal ? " · " : ""}
                {renewal ? `Renews ${renewal}` : ""}
              </p>
            )}
          </div>
          {hasSub && (
            <Button variant="outline" onClick={manage} disabled={busy !== null}>
              {busy === "portal" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Manage billing"
              )}
            </Button>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium text-[#1c0a0c]">Have a promo code?</p>
            <p className="text-xs text-[#1c0a0c]/60">
              Redeem a code to unlock a discount or a free plan.
            </p>
          </div>
          <div className="flex gap-2">
            <Input
              value={promoInput}
              onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
              placeholder="Enter code"
              className="w-40 font-mono uppercase sm:w-48"
            />
            <Button
              variant="outline"
              onClick={redeem}
              disabled={redeeming || !promoInput.trim()}
            >
              {redeeming ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
            </Button>
          </div>
        </div>
        {discount?.percentOff ? (
          <div className="mt-3 rounded-lg bg-[#c74959]/10 px-3 py-2 text-sm text-[#8f2f3b]">
            {discount.percentOff}% off will be applied at checkout
            {discount.appliesToPlan && discount.appliesToPlan !== "any"
              ? ` (${discount.appliesToPlan})`
              : ""}
            .
          </div>
        ) : null}
      </Card>

      <div className="flex justify-center">
        <IntervalToggle value={interval} onChange={setInterval} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {PLANS.map((plan) => {
          // Admin promotional offers apply to the MONTHLY price only; the yearly
          // price already carries its own 20% discount.
          const offer = interval === "month" ? status?.offers?.[plan.key] : undefined;
          const pricing = planPricing(plan, interval);
          const showYearly = interval === "year" && plan.monthlyPrice > 0;
          return (
          <Card
            key={plan.key}
            className={cn(
              "flex flex-col p-6",
              plan.highlighted && "ring-2 ring-[#c74959]"
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-[#1c0a0c]">
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
              {plan.key === current ? (
                <Badge className="bg-[#c74959] text-white">Current</Badge>
              ) : plan.highlighted ? (
                <Badge variant="outline">Recommended</Badge>
              ) : null}
            </div>
            <div className="mt-2">
              {offer ? (
                <div className="flex items-baseline gap-2">
                  {/* Diagonal strike over the original price. */}
                  <span
                    className="text-2xl font-bold text-[#1c0a0c]/40"
                    style={{
                      backgroundImage:
                        "linear-gradient(to top right, transparent calc(50% - 1px), #c74959 calc(50% - 1px), #c74959 calc(50% + 1px), transparent calc(50% + 1px))",
                    }}
                  >
                    ${offer.originalPrice}
                  </span>
                  <span className="text-3xl font-bold text-green-600">
                    ${offer.offerPrice}
                  </span>
                  <span className="text-sm text-[#1c0a0c]/50">/mo</span>
                </div>
              ) : (
                <>
                  <span className="text-3xl font-bold text-[#1c0a0c]">
                    {pricing.perMonthLabel}
                  </span>
                  <span className="text-sm text-[#1c0a0c]/50">
                    {pricing.suffix}
                  </span>
                </>
              )}
              {offer && (offer.label || offer.endsAt) ? (
                <p className="mt-1 text-xs font-medium text-green-700">
                  {offer.label || "Limited-time offer"}
                  {offer.endsAt
                    ? ` · ends ${new Date(offer.endsAt).toLocaleDateString(
                        undefined,
                        { month: "long", day: "numeric", year: "numeric" }
                      )}`
                    : ""}
                </p>
              ) : (
                <p className="mt-1 text-xs text-[#1c0a0c]/50">
                  {pricing.billedNote}
                </p>
              )}
            </div>
            <p className="mt-2 text-sm text-[#1c0a0c]/60">{plan.blurb}</p>
            <ul className="mt-4 flex-1 space-y-2 text-sm text-[#1c0a0c]/80">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#c74959]" />
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-6">{renderCta(plan.key, plan.name)}</div>
          </Card>
          );
        })}
      </div>
    </div>
  );
}

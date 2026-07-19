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
import { PLANS, planPricing, formatPrice } from "@/lib/plans";
import { useTranslation } from "@/lib/i18n/client";
import { useLanguage } from "@/components/providers/i18n-provider";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { IntervalToggle } from "@/components/pricing/interval-toggle";
import { toast } from "sonner";

// Stripe subscription status -> i18n key. 'comped' (an admin-granted plan) is
// deliberately shown as "Active" so it never reads as charity to the customer.
const STATUS_KEY: Record<string, string> = {
  active: "billing.status.active",
  trialing: "billing.status.trialing",
  past_due: "billing.status.past_due",
  canceled: "billing.status.canceled",
  incomplete: "billing.status.incomplete",
  unpaid: "billing.status.unpaid",
  comped: "billing.status.active",
};

export function BillingSettings() {
  const { t } = useTranslation();
  const lng = useLanguage();
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
      .catch(() => toast.error(t("billing.loadFailed")))
      .finally(() => setLoading(false));
  }, [token, t]);

  useEffect(() => {
    load();
  }, [load]);

  // Toast on return from Stripe Checkout (?checkout=success|cancelled).
  useEffect(() => {
    const c = params.get("checkout");
    if (c === "success") toast.success(t("toast.subscriptionUpdated"));
    else if (c === "cancelled") toast(t("billing.checkoutCancelled"));
  }, [params, t]);

  const upgrade = async (plan: PlanKey) => {
    if (!token) return;
    setBusy(plan);
    try {
      const res = await billingApi.checkout(plan, token, {
        interval,
        promotionCode: discount?.promotionCode,
      });
      if (res.data?.url) window.location.assign(res.data.url);
      else toast.error(t("billing.checkoutFailed"));
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
      else toast.error(t("billing.portalFailed"));
    } catch (e) {
      toast.error((e as Error)?.message || "Could not open billing portal");
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="py-8 text-center text-[#1c0a0c]/60">{t("billing.loadingBilling")}</div>
      </Card>
    );
  }

  const current: PlanKey = status?.planName ?? "free";
  const hasSub = status?.hasSubscription ?? false;
  const currentPlan = PLANS.find((p) => p.key === current);
  const renewal = status?.currentPeriodEnd
    ? new Date(status.currentPeriodEnd).toLocaleDateString(lng)
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
        t("billing.manageBilling")
      )}
    </Button>
  );

  const renderCta = (planKey: PlanKey, planName: string) => {
    if (planKey === current) {
      return (
        <Button variant="outline" disabled className="w-full">
          {t("billing.currentPlan")}
        </Button>
      );
    }
    if (planKey === "free") {
      return hasSub ? (
        manageButton
      ) : (
        <Button variant="outline" disabled className="w-full">
          {t("billing.included")}
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
          t("billing.upgradeTo", { plan: planName })
        )}
      </Button>
    );
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-[#1c0a0c]/60">{t("billing.currentPlan")}</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-xl font-bold text-[#1c0a0c]">
                {currentPlan?.name ?? "Free"}
              </span>
              {status?.subscriptionStatus && (
                <Badge variant="outline">
                  {STATUS_KEY[status.subscriptionStatus]
                    ? t(STATUS_KEY[status.subscriptionStatus])
                    : status.subscriptionStatus}
                </Badge>
              )}
            </div>
            {hasSub && (renewal || status?.billingInterval) && (
              <p className="mt-1 text-xs text-[#1c0a0c]/50">
                {status?.billingInterval === "year"
                  ? t("billing.billedYearly")
                  : status?.billingInterval === "month"
                    ? t("billing.billedMonthly")
                    : null}
                {status?.billingInterval && renewal ? " · " : ""}
                {renewal ? t("billing.renews", { date: renewal }) : ""}
              </p>
            )}
          </div>
          {hasSub && (
            <Button variant="outline" onClick={manage} disabled={busy !== null}>
              {busy === "portal" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t("billing.manageBilling")
              )}
            </Button>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium text-[#1c0a0c]">{t("billing.havePromoCode")}</p>
            <p className="text-xs text-[#1c0a0c]/60">
              {t("billing.redeemHint")}
            </p>
          </div>
          <div className="flex gap-2">
            <Input
              value={promoInput}
              onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
              placeholder={t("billing.enterCode")}
              className="w-40 font-mono uppercase sm:w-48"
            />
            <Button
              variant="outline"
              onClick={redeem}
              disabled={redeeming || !promoInput.trim()}
            >
              {redeeming ? <Loader2 className="h-4 w-4 animate-spin" /> : t("billing.apply")}
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
        <IntervalToggle
          value={interval}
          onChange={setInterval}
          showSave={!Object.values(status?.offers ?? {}).some((o) => o?.year)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {PLANS.map((plan) => {
          // Admin promotional offer for the toggled interval (monthly or yearly);
          // a yearly offer replaces that plan's flat 20% yearly saving.
          const offer = status?.offers?.[plan.key]?.[interval];
          const pricing = planPricing(plan, interval);
          const showYearly = interval === "year" && plan.monthlyPrice > 0;
          // On the yearly interval an offer is quoted PER MONTH, exactly like a
          // non-offer card. The struck price is the plain monthly list price: an
          // offer REPLACES the built-in 20% yearly discount rather than stacking
          // on top of it.
          const offerStrike = offer
            ? interval === "year"
              ? plan.monthlyPrice
              : offer.originalPrice
            : 0;
          const offerPerMonth = offer
            ? interval === "year"
              ? offer.offerPrice / 12
              : offer.offerPrice
            : 0;
          // Derive the badge from the two figures actually on the card; the
          // backend percentOff is measured against the discounted yearly list.
          const offerPercent =
            offer && offerStrike > 0
              ? Math.round(((offerStrike - offerPerMonth) / offerStrike) * 100)
              : (offer?.percentOff ?? 0);
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
                    {t("billing.save", { percent: offerPercent })}
                  </span>
                ) : showYearly ? (
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-bold text-green-700">
                    {t("billing.save", { percent: pricing.savingsPercent })}
                  </span>
                ) : null}
              </div>
              {plan.key === current ? (
                <Badge className="bg-[#c74959] text-white">{t("billing.current")}</Badge>
              ) : plan.highlighted ? (
                <Badge variant="outline">{t("billing.recommended")}</Badge>
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
                    {formatPrice(offerStrike)}
                  </span>
                  <span className="text-3xl font-bold text-green-600">
                    {formatPrice(offerPerMonth)}
                  </span>
                  <span className="text-sm text-[#1c0a0c]/50">
                    {t("pricing.perMo")}
                  </span>
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
              {offer ? (
                <>
                  <p className="mt-1 text-xs text-[#1c0a0c]/50">
                    {t(interval === "year" ? "pricing.billedAnnually" : "pricing.billedMonthly")}
                  </p>
                  {offer.label || offer.endsAt ? (
                    <p className="mt-1 text-xs font-medium text-green-700">
                      {offer.label || t("pricing.limitedOffer")}
                      {offer.endsAt
                        ? ` · ${t("pricing.ends", { date: new Date(offer.endsAt).toLocaleDateString(lng, { month: "long", day: "numeric", year: "numeric" }) })}`
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
            <ul className="mt-4 flex-1 space-y-2 text-sm text-[#1c0a0c]/80">
              {plan.featureKeys.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#c74959]" />
                  {t(f)}
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

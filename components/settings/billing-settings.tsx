"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Check, Loader2 } from "lucide-react";
import {
  billingApi,
  type BillingInterval,
  type BillingStatus,
  type PlanChangePreview,
  type PlanKey,
} from "@/lib/api";
import { PLANS, PLAN_ORDER, planPricing, formatPrice } from "@/lib/plans";
import { isPaddleProvider, openPaddleCheckout, setPaddleOnComplete } from "@/lib/paddle";
import { useTranslation } from "@/lib/i18n/client";
import { useLanguage } from "@/components/providers/i18n-provider";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { IntervalToggle } from "@/components/pricing/interval-toggle";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

/** upgrade / downgrade / same — mirrors the backend directionOf. */
function changeDirection(
  curPlan: PlanKey,
  curInterval: BillingInterval | null,
  newPlan: PlanKey,
  newInterval: BillingInterval
): "upgrade" | "downgrade" | "same" {
  const ci = curInterval ?? "month";
  if (curPlan === newPlan && ci === newInterval) return "same";
  const rank = (p: PlanKey) => PLAN_ORDER.indexOf(p);
  if (rank(newPlan) > rank(curPlan)) return "upgrade";
  if (rank(newPlan) < rank(curPlan)) return "downgrade";
  return newInterval === "year" ? "upgrade" : "downgrade";
}

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
  // In-app plan-change flow (prorated). The dialog previews the exact charge.
  const [changeTarget, setChangeTarget] = useState<{
    plan: PlanKey;
    interval: BillingInterval;
    direction: "upgrade" | "downgrade";
  } | null>(null);
  const [preview, setPreview] = useState<PlanChangePreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  // Confirm dialog for cancelling the subscription at period end.
  const [confirmCancel, setConfirmCancel] = useState(false);

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

  // Reload the subscription when a Paddle overlay checkout completes (no redirect).
  useEffect(() => {
    setPaddleOnComplete(() => {
      toast.success(t("toast.subscriptionUpdated"));
      load();
    });
    return () => setPaddleOnComplete(null);
  }, [t, load]);

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
      if (res.data?.transactionId) {
        // Paddle: open the overlay checkout (completion reloads via the callback).
        await openPaddleCheckout(
          res.data.transactionId,
          `${window.location.origin}/dashboard/settings?tab=billing&checkout=success`
        );
      } else if (res.data?.url) {
        window.location.assign(res.data.url); // Stripe: hosted redirect
      } else {
        toast.error(t("billing.checkoutFailed"));
      }
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

  // Open the change dialog and fetch the exact prorated preview for that target.
  const openChange = async (plan: PlanKey, planInterval: BillingInterval) => {
    if (!token || !status) return;
    const direction = changeDirection(status.planName, status.billingInterval, plan, planInterval);
    if (direction === "same") return;
    // A downgrade that LENGTHENS the interval (monthly → yearly) isn't offered —
    // change the tier first, then the interval. Yearly → monthly IS supported: it's
    // scheduled for the period end so the paid year is never destroyed.
    if (
      direction === "downgrade" &&
      planInterval !== status.billingInterval &&
      status.billingInterval === "month" &&
      isPaddleProvider()
    ) {
      toast.error(t("billing.downgradeIntervalUnsupported"));
      return;
    }
    setChangeTarget({ plan, interval: planInterval, direction });
    setPreview(null);
    setPreviewLoading(true);
    try {
      const res = await billingApi.changePreview(plan, token, { interval: planInterval });
      setPreview(res.data ?? null);
    } catch (e) {
      toast.error((e as Error)?.message || t("billing.changeFailed"));
      setChangeTarget(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const confirmChange = async () => {
    if (!token || !changeTarget) return;
    setApplying(true);
    try {
      const res = await billingApi.changePlan(changeTarget.plan, token, {
        interval: changeTarget.interval,
      });
      toast.success(
        res.data?.direction === "downgrade"
          ? t("billing.changeScheduledToast")
          : t("billing.changedToast")
      );
      setChangeTarget(null);
      load();
    } catch (e) {
      toast.error((e as Error)?.message || t("billing.changeFailed"));
    } finally {
      setApplying(false);
    }
  };

  const cancelPending = async () => {
    if (!token) return;
    setBusy("cancel-pending");
    try {
      await billingApi.cancelChange(token);
      toast.success(t("billing.changeCancelledToast"));
      load();
    } catch (e) {
      toast.error((e as Error)?.message || t("billing.changeFailed"));
    } finally {
      setBusy(null);
    }
  };

  // Cancel at period end (keep access until then, no further charge).
  const cancelSub = async () => {
    if (!token) return;
    setBusy("cancel-sub");
    try {
      await billingApi.cancelSubscription(token);
      toast.success(t("billing.cancelledToast"));
      setConfirmCancel(false);
      load();
    } catch (e) {
      toast.error((e as Error)?.message || t("billing.changeFailed"));
    } finally {
      setBusy(null);
    }
  };

  // Undo a scheduled cancellation — the subscription renews as usual again.
  const resumeSub = async () => {
    if (!token) return;
    setBusy("resume-sub");
    try {
      await billingApi.resumeSubscription(token);
      toast.success(t("billing.resumedToast"));
      load();
    } catch (e) {
      toast.error((e as Error)?.message || t("billing.changeFailed"));
    } finally {
      setBusy(null);
    }
  };

  // Localized money from cents.
  const fmtCents = (cents: number, currency: string) => {
    try {
      return new Intl.NumberFormat(lng, { style: "currency", currency }).format(cents / 100);
    } catch {
      return `$${(cents / 100).toFixed(2)}`;
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
  // Promotional offers + promo codes work on both providers (Stripe coupons /
  // Paddle discounts), auto-applied at checkout — so they're always shown.
  const offers = status?.offers;
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

  const curInterval = status?.billingInterval ?? null;

  // A note on when the plan renews / ends. A comped plan may have an expiry
  // (timed comp) or none (lifetime); a real subscription set to cancel "ends"
  // rather than "renews" on its period end.
  const isComped = status?.subscriptionStatus === "comped";
  const willCancel = Boolean(status?.cancelAtPeriodEnd);
  const billedLine =
    curInterval === "year"
      ? t("billing.billedYearly")
      : curInterval === "month"
        ? t("billing.billedMonthly")
        : null;
  const periodNote = isComped
    ? renewal
      ? t("billing.compedUntil", { date: renewal })
      : t("billing.compedLifetime")
    : hasSub && renewal
      ? willCancel
        ? t("billing.endsOn", { date: renewal })
        : t("billing.renewsOn", { date: renewal })
      : null;

  /**
   * While an offer is running it is the CURRENT price of the plan, not a
   * new-customer-only deal — an existing subscriber renewing inside the window is
   * billed the offer price too. Say so on the current-plan card, otherwise they
   * see "$5.60" advertised elsewhere on the same page and reasonably assume they
   * are still being charged full price.
   */
  const currentOffer =
    hasSub && !isComped && !willCancel && current !== "free"
      ? offers?.[current]?.[status?.billingInterval === "year" ? "year" : "month"]
      : undefined;

  const renderCta = (planKey: PlanKey, planName: string) => {
    // Free card: subscribers cancel via the portal; free users see "Included".
    if (planKey === "free") {
      if (!hasSub) {
        return current === "free" ? (
          <Button variant="outline" disabled className="w-full">
            {t("billing.currentPlan")}
          </Button>
        ) : (
          <Button variant="outline" disabled className="w-full">
            {t("billing.included")}
          </Button>
        );
      }
      return manageButton; // cancel to Free via portal
    }

    // No live Stripe subscription (Free, or a COMPED paid plan with no sub).
    if (!hasSub) {
      // The account's current (comped) plan is not an "upgrade" target.
      if (planKey === current) {
        return (
          <Button variant="outline" disabled className="w-full">
            {t("billing.currentPlan")}
          </Button>
        );
      }
      // A different paid plan → fresh Checkout (nothing to prorate against).
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
    }

    // Subscriber: in-app prorated change to (planKey @ toggled interval).
    const direction = changeDirection(current, curInterval, planKey, interval);
    if (direction === "same") {
      return (
        <Button variant="outline" disabled className="w-full">
          {t("billing.currentPlan")}
        </Button>
      );
    }
    // A yearly subscriber is never offered a move to monthly billing — not the
    // same tier ("Switch to monthly") and not a tier downgrade that also shortens
    // the interval. They keep the year they paid for; monthly becomes available
    // once that year ends and they are no longer subscribed.
    if (curInterval === "year" && interval === "month") {
      return (
        <Button variant="outline" disabled className="h-auto w-full whitespace-normal py-2 text-xs">
          {t("billing.switchAfterYearly")}
        </Button>
      );
    }
    const sameTier = planKey === current;
    const label = sameTier
      ? interval === "year"
        ? t("billing.switchToYearly")
        : t("billing.switchToMonthly")
      : direction === "upgrade"
        ? t("billing.upgradeTo", { plan: planName })
        : t("billing.downgradeTo", { plan: planName });
    return (
      <Button
        className={cn(
          "w-full",
          direction === "upgrade"
            ? "bg-[#c74959] text-white hover:bg-[#b03f4d]"
            : ""
        )}
        variant={direction === "upgrade" ? "default" : "outline"}
        onClick={() => openChange(planKey, interval)}
        disabled={busy !== null || applying}
      >
        {label}
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
            {(billedLine || periodNote) && (
              <div className="mt-1 space-y-0.5 text-xs text-[#1c0a0c]/50">
                {hasSub && billedLine && <p>{billedLine}</p>}
                {periodNote && <p>{periodNote}</p>}
              </div>
            )}
            {currentOffer && (
              <p className="mt-2 rounded-lg bg-green-50 px-3 py-2 text-xs font-medium text-green-800">
                {t("billing.offerAppliesToRenewals", {
                  label: currentOffer.label || t("pricing.limitedOffer"),
                  price: formatPrice(
                    status?.billingInterval === "year"
                      ? currentOffer.offerPrice / 12
                      : currentOffer.offerPrice
                  ),
                  regular: formatPrice(
                    PLANS.find((p) => p.key === current)?.monthlyPrice ?? 0
                  ),
                })}
              </p>
            )}
            <p className="mt-1 text-xs text-[#1c0a0c]/45">
              {t("billing.accountWide")}
            </p>
          </div>
          {hasSub && (
            <div className="flex flex-col items-stretch gap-2 sm:items-end">
              <Button variant="outline" onClick={manage} disabled={busy !== null}>
                {busy === "portal" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t("billing.manageBilling")
                )}
              </Button>
              {willCancel ? (
                // Already set to cancel — offer to resume (keep the plan).
                <Button
                  onClick={resumeSub}
                  disabled={busy !== null}
                  className="bg-[#c74959] text-white hover:bg-[#b03f4d]"
                >
                  {busy === "resume-sub" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    t("billing.resumeSubscription")
                  )}
                </Button>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmCancel(true)}
                  disabled={busy !== null}
                  className="text-xs text-[#1c0a0c]/45 underline underline-offset-2 hover:text-[#c74959] disabled:opacity-50"
                >
                  {t("billing.cancelSubscription")}
                </button>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Confirm cancel-at-period-end. */}
      <AlertDialog open={confirmCancel} onOpenChange={(o) => !o && setConfirmCancel(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("billing.cancelSubTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {renewal
                ? t("billing.cancelSubBody", {
                    plan: currentPlan?.name ?? "",
                    date: renewal,
                  })
                : t("billing.cancelSubBodyNoDate", { plan: currentPlan?.name ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {/* "Keep" is the emphasised choice because it's the safe one, but the
              cancel action stays a full, clearly-labelled button — a greyed-out
              or hidden cancel would be a dark pattern, not a design. */}
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#c74959] text-white hover:bg-[#b03f4d] hover:text-white">
              {t("billing.keepSubscription")}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={cancelSub}
              disabled={busy !== null}
            >
              {busy === "cancel-sub" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t("billing.cancelSubscription")
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {status?.pendingPlan && (
        <Card className="border-[#c74959]/30 bg-[#c74959]/5 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-[#1c0a0c]/80">
              {t("billing.pendingChange", {
                plan: PLANS.find((p) => p.key === status.pendingPlan)?.name ?? status.pendingPlan,
                date: status.pendingEffectiveAt
                  ? new Date(status.pendingEffectiveAt).toLocaleDateString(lng)
                  : "",
              })}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={cancelPending}
              disabled={busy !== null}
            >
              {busy === "cancel-pending" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t("billing.cancelChange")
              )}
            </Button>
          </div>
        </Card>
      )}

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
          showSave={!Object.values(offers ?? {}).some((o) => o?.year)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {PLANS.map((plan) => {
          // Admin promotional offer for the toggled interval (monthly or yearly);
          // a yearly offer replaces that plan's flat 20% yearly saving.
          const offer = offers?.[plan.key]?.[interval];
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
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold text-[#1c0a0c]">
                  {plan.name}
                </h3>
                {plan.badgeKey && (
                  <span className="rounded-full bg-[#c74959]/10 px-2 py-0.5 text-[11px] font-semibold text-[#c74959]">
                    {t(plan.badgeKey)}
                  </span>
                )}
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

      {/* Prorated plan-change confirmation. Upgrades show the exact charge now;
          downgrades take effect at period end (no charge). */}
      <AlertDialog
        open={!!changeTarget}
        onOpenChange={(o) => {
          if (!o && !applying) setChangeTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {changeTarget?.direction === "upgrade"
                ? t("billing.confirmUpgradeTitle")
                : t("billing.confirmDowngradeTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-[#1c0a0c]/70">
                {previewLoading || !preview ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> {t("billing.calculating")}
                  </span>
                ) : preview.direction === "upgrade" ? (
                  <>
                    <span className="block">
                      {t("billing.upgradeChargeNow", {
                        amount: fmtCents(preview.amountDueNow, preview.currency),
                      })}
                    </span>
                    <span className="block text-xs text-[#1c0a0c]/50">
                      {t("billing.upgradeProrationNote")}
                    </span>
                  </>
                ) : (
                  <span className="block">
                    {t(
                      // A yearly → monthly switch also starts a new billing cycle on
                      // that date, so say so rather than implying nothing is charged.
                      changeTarget && changeTarget.interval !== status?.billingInterval
                        ? "billing.downgradeIntervalNote"
                        : "billing.downgradeNote",
                      {
                        date: preview.effectiveAt
                          ? new Date(preview.effectiveAt).toLocaleDateString(lng)
                          : "",
                      }
                    )}
                  </span>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={applying}>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmChange();
              }}
              disabled={applying || previewLoading || !preview}
              className="bg-[#c74959] text-white hover:bg-[#b03f4d]"
            >
              {applying ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : preview?.direction === "upgrade" ? (
                t("billing.payAndUpgrade", {
                  amount: preview ? fmtCents(preview.amountDueNow, preview.currency) : "",
                })
              ) : (
                t("billing.scheduleChange")
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

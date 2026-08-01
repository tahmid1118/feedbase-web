"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Check, Loader2 } from "lucide-react";
import { billingApi, type BillingInterval, type OfferMap } from "@/lib/api";
import { publicApi } from "@/lib/api/public";
import { planByKey, planPricing, formatPrice, offerDisplay } from "@/lib/plans";
import { readPlanIntent } from "@/lib/plan-intent";
import { openPaddleCheckout, setPaddleOnComplete } from "@/lib/paddle";
import { useTranslation } from "@/lib/i18n/client";
import { useLanguage } from "@/components/providers/i18n-provider";
import { IntervalToggle } from "@/components/pricing/interval-toggle";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

/**
 * Post-onboarding payment step: the plan a visitor picked on the pricing page,
 * ready to activate.
 *
 * It sits AFTER onboarding by necessity, not preference — `POST /billing/checkout`
 * requires `role === "owner"`, and creating a workspace is what makes the account
 * an owner. Abandoning here is harmless: they already have a working Free
 * workspace, which is why "Continue on the Free plan" is offered rather than
 * hidden.
 */
export default function CheckoutPage() {
  const { t } = useTranslation();
  const lng = useLanguage();
  const router = useRouter();
  const params = useSearchParams();
  const { data: session, status: authStatus } = useSession();

  const intent = readPlanIntent(params);
  const plan = intent ? planByKey(intent.plan) : undefined;
  const [interval, setInterval] = useState<BillingInterval>(intent?.interval ?? "year");
  const [offers, setOffers] = useState<OfferMap>({});
  const [paying, setPaying] = useState(false);
  const [checking, setChecking] = useState(true);

  const token = session?.user?.accessToken;

  /**
   * Guards, in order. Each one answers "can this person actually buy this?" —
   * the server enforces the same rules, so these only spare the user a failed
   * request and a confusing error.
   */
  useEffect(() => {
    if (authStatus === "loading") return;
    if (authStatus === "unauthenticated") {
      router.replace("/login");
      return;
    }
    if (!session?.user?.tenantId) {
      router.replace(`/onboarding?plan=${intent?.plan ?? ""}&interval=${interval}`);
      return;
    }
    if (session.user.role !== "owner" || !intent || !plan) {
      router.replace("/dashboard");
      return;
    }
    // Already paying for something — send them to Billing rather than letting
    // them start a second subscription (the API refuses it anyway).
    if (!token) return;
    billingApi
      .getStatus(token)
      .then((res) => {
        const s = res.data;
        if (s && s.planName !== "free" && s.subscriptionStatus) {
          router.replace("/dashboard/settings?tab=billing");
        } else {
          setChecking(false);
        }
      })
      .catch(() => setChecking(false));
  }, [authStatus, session, token, intent, plan, interval, router]);

  // Offers drive the same strike-through price the pricing card showed, so the
  // figure doesn't change between choosing a plan and paying for it.
  useEffect(() => {
    publicApi
      .getOffers()
      .then((o) => setOffers(o ?? {}))
      .catch(() => setOffers({}));
  }, []);

  useEffect(() => {
    setPaddleOnComplete(() => {
      toast.success(t("toast.subscriptionUpdated"));
      window.location.assign("/dashboard?checkout=success");
    });
    return () => setPaddleOnComplete(null);
  }, [t]);

  const pay = useCallback(async () => {
    if (!token || !intent) return;
    setPaying(true);
    try {
      const res = await billingApi.checkout(intent.plan, token, { interval });
      if (res.data?.transactionId) {
        await openPaddleCheckout(
          res.data.transactionId,
          `${window.location.origin}/dashboard?checkout=success`
        );
      } else if (res.data?.url) {
        window.location.assign(res.data.url); // Stripe: hosted redirect
      } else {
        toast.error(t("billing.checkoutFailed"));
      }
    } catch (e) {
      const msg = (e as Error)?.message || "";
      if (/already have an active subscription/i.test(msg)) {
        toast.error(msg);
        router.replace("/dashboard/settings?tab=billing");
        return;
      }
      toast.error(msg || t("billing.checkoutFailed"));
    } finally {
      setPaying(false);
    }
  }, [token, intent, interval, t, router]);

  if (authStatus === "loading" || checking || !plan || !intent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fdf8f9]">
        <Loader2 className="h-6 w-6 animate-spin text-[#c74959]" />
      </div>
    );
  }

  const offer = offers[plan.key]?.[interval];
  const pricing = planPricing(plan, interval);
  const { strike, perMonth, percent } = offerDisplay(plan, interval, offer);

  return (
    <div className="flex min-h-screen flex-col items-center bg-[#fdf8f9] px-4 py-10">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <Image src="/icon.svg" alt="FeedBoard" width={32} height={32} priority />
        <span className="text-xl font-bold text-[#1c0a0c]">FeedBoard</span>
      </Link>

      <Card className="w-full max-w-md p-6">
        <h1 className="text-2xl font-bold text-[#1c0a0c]">
          {t("checkout.title", { plan: plan.name })}
        </h1>
        <p className="mt-1 text-sm text-[#1c0a0c]/60">{t("checkout.subtitle")}</p>

        <div className="mt-5 flex justify-center">
          <IntervalToggle value={interval} onChange={setInterval} showSave={!offer} />
        </div>

        <div className="mt-5 rounded-xl border border-[#e399a3]/30 bg-white p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-lg font-semibold text-[#1c0a0c]">{plan.name}</span>
            {plan.badgeKey && (
              <span className="rounded-full bg-[#c74959]/10 px-2 py-0.5 text-[11px] font-semibold text-[#c74959]">
                {t(plan.badgeKey)}
              </span>
            )}
            {offer && (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-bold text-green-700">
                {t("billing.save", { percent })}
              </span>
            )}
          </div>

          <div className="mt-2">
            {offer ? (
              <div className="flex items-baseline gap-2">
                <span
                  className="text-xl font-bold text-[#1c0a0c]/40"
                  style={{
                    backgroundImage:
                      "linear-gradient(to top right, transparent calc(50% - 1px), #c74959 calc(50% - 1px), #c74959 calc(50% + 1px), transparent calc(50% + 1px))",
                  }}
                >
                  {formatPrice(strike)}
                </span>
                <span className="text-3xl font-bold text-green-600">{formatPrice(perMonth)}</span>
                <span className="text-[#1c0a0c]/50">{t("pricing.perMo")}</span>
              </div>
            ) : (
              <>
                <span className="text-3xl font-bold text-[#1c0a0c]">{pricing.perMonthLabel}</span>
                <span className="text-[#1c0a0c]/50">{pricing.suffix}</span>
              </>
            )}
            <p className="mt-1 text-xs text-[#1c0a0c]/50">
              {offer
                ? t(interval === "year" ? "pricing.billedAnnually" : "pricing.billedMonthly")
                : t(pricing.billedNoteKey, pricing.billedNoteParams)}
            </p>
            {offer && (offer.label || offer.endsAt) ? (
              <p className="mt-1 text-xs font-medium text-green-700">
                {offer.label || t("pricing.limitedOffer")}
                {offer.endsAt
                  ? ` · ${t("pricing.ends", {
                      date: new Date(offer.endsAt).toLocaleDateString(lng, {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      }),
                    })}`
                  : ""}
              </p>
            ) : null}
          </div>

          <ul className="mt-4 space-y-2 text-sm text-[#1c0a0c]/80">
            {plan.featureKeys.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#c74959]" />
                {t(f)}
              </li>
            ))}
          </ul>
        </div>

        {/*
          Deliberately NOT a "Total today" figure. Paddle is Merchant of Record
          and adds tax on top, which varies by the buyer's country — a concrete
          total here would be a number we don't compute and can't guarantee, i.e.
          the advertised-price-vs-charged-price bug BILLING_CHECKS.md exists for.
        */}
        <p className="mt-3 text-xs text-[#1c0a0c]/50">{t("checkout.taxNote")}</p>

        <Button
          className="mt-5 w-full bg-[#c74959] text-white hover:bg-[#b03f4d]"
          onClick={pay}
          disabled={paying}
        >
          {paying ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            t("checkout.pay", { plan: plan.name })
          )}
        </Button>

        <button
          type="button"
          onClick={() => router.replace("/dashboard")}
          className="mt-3 w-full text-center text-xs text-[#1c0a0c]/50 underline hover:text-[#c74959]"
        >
          {t("checkout.continueFree")}
        </button>
      </Card>
    </div>
  );
}

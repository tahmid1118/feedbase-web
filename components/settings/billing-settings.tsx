"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Check, Loader2 } from "lucide-react";
import { billingApi, type BillingStatus, type PlanKey } from "@/lib/api";
import { PLANS } from "@/lib/plans";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const STATUS_LABEL: Record<string, string> = {
  active: "Active",
  trialing: "Trial",
  past_due: "Past due",
  canceled: "Canceled",
  incomplete: "Incomplete",
  unpaid: "Unpaid",
};

export function BillingSettings() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const params = useSearchParams();

  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null); // plan key or "portal"

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
      const res = await billingApi.checkout(plan, token);
      if (res.data?.url) window.location.assign(res.data.url);
      else toast.error("Could not start checkout");
    } catch (e) {
      toast.error((e as Error)?.message || "Could not start checkout");
    } finally {
      setBusy(null);
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
            {renewal && hasSub && (
              <p className="mt-1 text-xs text-[#1c0a0c]/50">Renews {renewal}</p>
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

      <div className="grid gap-4 lg:grid-cols-3">
        {PLANS.map((plan) => (
          <Card
            key={plan.key}
            className={cn(
              "flex flex-col p-6",
              plan.highlighted && "ring-2 ring-[#c74959]"
            )}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#1c0a0c]">
                {plan.name}
              </h3>
              {plan.key === current ? (
                <Badge className="bg-[#c74959] text-white">Current</Badge>
              ) : plan.highlighted ? (
                <Badge variant="outline">Recommended</Badge>
              ) : null}
            </div>
            <div className="mt-2">
              <span className="text-3xl font-bold text-[#1c0a0c]">
                {plan.priceLabel}
              </span>
              <span className="text-sm text-[#1c0a0c]/50">
                {plan.priceSuffix}
              </span>
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
        ))}
      </div>
    </div>
  );
}

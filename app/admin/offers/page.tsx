"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Loader2, Plus, Ban } from "lucide-react";
import { adminApi, type Offer, type CreateOfferInput } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LocalTime } from "@/components/local-time";
import { planByKey, planPricing, formatPrice } from "@/lib/plans";
import { toast } from "sonner";

type OfferInterval = "month" | "year";

// The whole-dollar list price for a plan on an interval (monthly price, or
// yearly TOTAL), sourced from the canonical display config so it never drifts.
// Mirrors the backend's listPrice(plan, interval).
function listPriceOf(plan: "pro" | "business", interval: OfferInterval): number {
  const p = planByKey(plan);
  if (!p) return 0;
  return interval === "year" ? planPricing(p, "year").yearlyTotal ?? 0 : p.monthlyPrice;
}

/** Default discount for a new offer. */
const DEFAULT_PERCENT_OFF = 20;

/**
 * Stripe cannot charge a fraction of a cent, so the price the admin's percentage
 * implies is rounded to cents. 33% off $10 is $6.70, not $6.699999.
 */
const toCents = (n: number) => Math.round(n * 100) / 100;

/** The price a percentage off the list price works out to. */
function priceFromPercent(
  plan: "pro" | "business",
  interval: OfferInterval,
  percentOff: number
): number {
  return toCents(listPriceOf(plan, interval) * (1 - percentOff / 100));
}

/** Stripe rejects charges under $0.50, so an offer can never go below it. */
const MIN_OFFER_PRICE = 0.5;

/**
 * A `datetime-local` value ("2026-07-27T00:57") carries no timezone, so sending
 * it as-is means the server reads the admin's wall clock as its own. Interpret it
 * in the admin's zone — which is what the dialog promises — and send the instant.
 */
function toInstant(local?: string | null): string | undefined {
  if (!local) return undefined;
  const d = new Date(local); // parsed as local time by the browser
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

/**
 * The discount an EXISTING offer represents — the table shows "(N% off)" for
 * offers already stored as a price (including any created before this form took
 * a percentage).
 */
function pct(plan: "pro" | "business", interval: OfferInterval, offer: number): number {
  const orig = listPriceOf(plan, interval);
  return orig > 0 ? Math.round((1 - offer / orig) * 100) : 0;
}

const EMPTY: CreateOfferInput = {
  plan: "pro",
  interval: "month",
  offerPrice: priceFromPercent("pro", "month", DEFAULT_PERCENT_OFF),
};

const intervalLabel = (i: OfferInterval) => (i === "year" ? "Yearly" : "Monthly");
const perSuffix = (i: OfferInterval) => (i === "year" ? "/yr" : "/mo");

export default function AdminOffersPage() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const [rows, setRows] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CreateOfferInput>(EMPTY);
  // The admin types a DISCOUNT; the price is derived. The API still takes a
  // price (the Stripe coupon is a fixed amount_off = list - offer), so the
  // percentage lives only in the form and is converted on submit.
  const [percentOff, setPercentOff] = useState(DEFAULT_PERCENT_OFF);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await adminApi.listOffers(token);
      setRows(res.data?.rows ?? []);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const set = (patch: Partial<CreateOfferInput>) => setForm((f) => ({ ...f, ...patch }));

  const create = async () => {
    if (!token) return;
    setBusy(true);
    // Send the derived price, not the percentage — that is what the API stores.
    // Send the schedule as an EXACT INSTANT. `<input type="datetime-local">`
    // yields "2026-07-27T00:57" with no zone, and the API used to store that
    // wall clock verbatim against a UTC database clock — so an admin in UTC+6
    // picking "now" created an offer that quietly went live six hours later.
    const res = await adminApi.createOffer(token, {
      ...form,
      offerPrice,
      startsAt: toInstant(form.startsAt),
      endsAt: toInstant(form.endsAt),
    });
    setBusy(false);
    if (res.ok) {
      toast.success(t("toast.offerCreated"));
      setOpen(false);
      setForm(EMPTY);
      setPercentOff(DEFAULT_PERCENT_OFF);
      load();
    } else toast.error(res.message || "Failed to create offer");
  };

  const deactivate = async (o: Offer) => {
    if (!token) return;
    const res = await adminApi.deactivateOffer(token, o.id);
    if (res.ok) {
      setRows((prev) => prev.map((r) => (r.id === o.id ? { ...r, is_active: 0 } : r)));
      toast.success(t("toast.offerEnded"));
    } else toast.error(res.message || "Failed");
  };

  const planPrice = listPriceOf(form.plan, form.interval);
  const offerPrice = priceFromPercent(form.plan, form.interval, percentOff);
  const valid =
    percentOff > 0 &&
    percentOff < 100 &&
    offerPrice >= MIN_OFFER_PRICE &&
    offerPrice < planPrice;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#1c0a0c]">{t("admin.nav.offers")}</h2>
          <p className="text-sm text-[#1c0a0c]/60">
            Put a promotional price on a paid plan. Active offers show a discounted
            price in every workspace&apos;s Billing tab and apply at checkout.
          </p>
        </div>
        <Button className="bg-[#c74959] text-white hover:bg-[#b03f4d]" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          {t("admin.newOffer")}
        </Button>
      </div>

      <Card className="overflow-x-auto p-0">
        {loading ? (
          <div className="py-12 text-center text-[#1c0a0c]/60">{t("common.loading")}</div>
        ) : rows.length === 0 ? (
          <div className="py-12 text-center text-[#1c0a0c]/60">{t("admin.noOffers")}</div>
        ) : (
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-[#e399a3]/20 text-left text-xs uppercase tracking-wide text-[#1c0a0c]/50">
              <tr>
                <th className="px-4 py-3">{t("admin.th.plan")}</th>
                <th className="px-4 py-3">{t("admin.th.billing")}</th>
                <th className="px-4 py-3">{t("admin.th.price")}</th>
                <th className="px-4 py-3">{t("admin.th.label")}</th>
                <th className="px-4 py-3">{t("admin.th.window")}</th>
                <th className="px-4 py-3">{t("common.status")}</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => {
                const offer = Number(o.offer_price);
                const iv: OfferInterval = o.billing_interval === "year" ? "year" : "month";
                const p = pct(o.plan, iv, offer);
                return (
                  <tr key={o.id} className="border-b border-[#e399a3]/10">
                    <td className="px-4 py-3 font-medium capitalize text-[#1c0a0c]">{o.plan}</td>
                    <td className="px-4 py-3 text-[#1c0a0c]/70">{intervalLabel(iv)}</td>
                    <td className="px-4 py-3">
                      <span className="text-[#1c0a0c]/50 line-through">{formatPrice(listPriceOf(o.plan, iv))}</span>{" "}
                      <span className="font-semibold text-green-600">{formatPrice(offer)}</span>
                      <span className="text-[#1c0a0c]/50">{perSuffix(iv)}</span>{" "}
                      <span className="text-xs text-[#1c0a0c]/50">({p}% off)</span>
                    </td>
                    <td className="px-4 py-3 text-[#1c0a0c]/70">{o.label || "—"}</td>
                    <td className="px-4 py-3 text-xs text-[#1c0a0c]/60">
                      {o.starts_at || o.ends_at ? (
                        <>
                          {o.starts_at ? <LocalTime date={o.starts_at} /> : "now"}
                          {" – "}
                          {o.ends_at ? <LocalTime date={o.ends_at} /> : "∞"}
                        </>
                      ) : (
                        "Always on"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {o.is_active ? (
                        <Badge className="bg-green-100 text-green-700">{t("common.active")}</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[#1c0a0c]/50">Ended</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {o.is_active === 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => deactivate(o)}
                        >
                          <Ban className="h-4 w-4" />
                          End
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>{t("admin.newOffer")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("admin.th.plan")}</Label>
              <Select
                value={form.plan}
                // The price follows from the percentage, so switching plan or
                // interval needs no price fixup — it recomputes.
                onValueChange={(v) => set({ plan: v as "pro" | "business" })}
              >
                <SelectTrigger className="w-full capitalize">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("admin.billingCycle")}</Label>
              <Select
                value={form.interval}
                onValueChange={(v) => set({ interval: v as OfferInterval })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Monthly (${listPriceOf(form.plan, "month")}/mo list)</SelectItem>
                  <SelectItem value="year">Yearly (${listPriceOf(form.plan, "year")}/yr list)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="o-percent">Discount (% off)</Label>
              <div className="relative">
                <Input
                  id="o-percent"
                  type="number"
                  min={1}
                  max={99}
                  step={1}
                  value={percentOff}
                  onChange={(e) => setPercentOff(Number(e.target.value))}
                  className="pr-8"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#1c0a0c]/40">
                  %
                </span>
              </div>

              {/* The resulting price, so the admin sees exactly what customers pay. */}
              {valid ? (
                <div className="rounded-lg border border-[#e399a3]/40 bg-[#fdf8f9] px-3 py-2">
                  <p className="text-sm text-[#1c0a0c]">
                    Customers pay{" "}
                    <span className="font-semibold text-[#c74959]">
                      {formatPrice(offerPrice)}
                      {perSuffix(form.interval)}
                    </span>{" "}
                    <span className="text-[#1c0a0c]/40 line-through">
                      {formatPrice(planPrice)}
                      {perSuffix(form.interval)}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs text-[#1c0a0c]/50">
                    {form.interval === "year"
                      ? `Billed annually — ${formatPrice(toCents(offerPrice / 12))}/mo equivalent. Saves ${formatPrice(toCents(planPrice - offerPrice))} per year.`
                      : `Saves ${formatPrice(toCents(planPrice - offerPrice))} per month.`}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-[#c74959]">
                  {percentOff <= 0 || percentOff >= 100
                    ? "Enter a discount between 1% and 99%."
                    : `That works out to ${formatPrice(offerPrice)}, below the ${formatPrice(MIN_OFFER_PRICE)} minimum Stripe can charge. Use a smaller discount.`}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="o-label">{t("admin.labelOptional")}</Label>
              <Input
                id="o-label"
                value={form.label ?? ""}
                onChange={(e) => set({ label: e.target.value })}
                placeholder="Launch offer"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="o-start">{t("admin.startsOptional")}</Label>
                <Input
                  id="o-start"
                  type="datetime-local"
                  value={form.startsAt ?? ""}
                  onChange={(e) => set({ startsAt: e.target.value || undefined })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="o-end">{t("admin.endsOptional")}</Label>
                <Input
                  id="o-end"
                  type="datetime-local"
                  value={form.endsAt ?? ""}
                  onChange={(e) => set({ endsAt: e.target.value || undefined })}
                />
              </div>
            </div>
            <p className="text-xs text-[#1c0a0c]/50">
              Times are in your local timezone. Leave blank for an always-on offer.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#c74959] text-white hover:bg-[#b03f4d]"
              disabled={!valid || busy}
              onClick={create}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create offer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

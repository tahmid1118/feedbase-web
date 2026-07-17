"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Loader2, Plus, Ban } from "lucide-react";
import { adminApi, type Offer, type CreateOfferInput } from "@/lib/api";
import { Card } from "@/components/ui/card";
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
import { planByKey, formatPrice } from "@/lib/plans";
import { toast } from "sonner";

// List prices (USD) sourced from the canonical display config so they never
// drift when plan pricing changes.
const PLAN_PRICE: Record<"pro" | "business", number> = {
  pro: planByKey("pro")?.monthlyPrice ?? 0,
  business: planByKey("business")?.monthlyPrice ?? 0,
};

// Default a new offer to ~20% off Pro (a whole-dollar starting point below the
// Pro list price); the admin can set any value, including cents.
const EMPTY: CreateOfferInput = {
  plan: "pro",
  offerPrice: Math.max(1, Math.round(PLAN_PRICE.pro * 0.8)),
};

function pct(plan: "pro" | "business", offer: number): number {
  const orig = PLAN_PRICE[plan];
  return orig > 0 ? Math.round((1 - offer / orig) * 100) : 0;
}

export default function AdminOffersPage() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const [rows, setRows] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CreateOfferInput>(EMPTY);
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
    const res = await adminApi.createOffer(token, form);
    setBusy(false);
    if (res.ok) {
      toast.success("Offer created");
      setOpen(false);
      setForm(EMPTY);
      load();
    } else toast.error(res.message || "Failed to create offer");
  };

  const deactivate = async (o: Offer) => {
    if (!token) return;
    const res = await adminApi.deactivateOffer(token, o.id);
    if (res.ok) {
      setRows((prev) => prev.map((r) => (r.id === o.id ? { ...r, is_active: 0 } : r)));
      toast.success("Offer ended");
    } else toast.error(res.message || "Failed");
  };

  const planPrice = PLAN_PRICE[form.plan];
  const valid = form.offerPrice > 0 && form.offerPrice < planPrice;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#1c0a0c]">Offers</h2>
          <p className="text-sm text-[#1c0a0c]/60">
            Put a promotional price on a paid plan. Active offers show a discounted
            price in every workspace&apos;s Billing tab and apply at checkout.
          </p>
        </div>
        <Button className="bg-[#c74959] text-white hover:bg-[#b03f4d]" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          New offer
        </Button>
      </div>

      <Card className="overflow-x-auto p-0">
        {loading ? (
          <div className="py-12 text-center text-[#1c0a0c]/60">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="py-12 text-center text-[#1c0a0c]/60">No offers yet.</div>
        ) : (
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-[#e399a3]/20 text-left text-xs uppercase tracking-wide text-[#1c0a0c]/50">
              <tr>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Label</th>
                <th className="px-4 py-3">Window</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => {
                const offer = Number(o.offer_price);
                const p = pct(o.plan, offer);
                return (
                  <tr key={o.id} className="border-b border-[#e399a3]/10">
                    <td className="px-4 py-3 font-medium capitalize text-[#1c0a0c]">{o.plan}</td>
                    <td className="px-4 py-3">
                      <span className="text-[#1c0a0c]/50 line-through">{formatPrice(PLAN_PRICE[o.plan])}</span>{" "}
                      <span className="font-semibold text-green-600">{formatPrice(offer)}</span>{" "}
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
                        <Badge className="bg-green-100 text-green-700">Active</Badge>
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
            <DialogTitle>New offer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Plan</Label>
              <Select
                value={form.plan}
                onValueChange={(v) => set({ plan: v as "pro" | "business" })}
              >
                <SelectTrigger className="w-full capitalize">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pro">Pro (${PLAN_PRICE.pro}/mo)</SelectItem>
                  <SelectItem value="business">Business (${PLAN_PRICE.business}/mo)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="o-price">Offer price (USD / month)</Label>
              <Input
                id="o-price"
                type="number"
                min={0.5}
                max={planPrice - 0.01}
                step={0.01}
                value={form.offerPrice}
                onChange={(e) => set({ offerPrice: Number(e.target.value) })}
              />
              <p className="text-xs text-[#1c0a0c]/50">
                {valid
                  ? `${pct(form.plan, form.offerPrice)}% off the $${planPrice} list price.`
                  : `Must be between $1 and $${planPrice - 1}.`}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="o-label">Label (optional)</Label>
              <Input
                id="o-label"
                value={form.label ?? ""}
                onChange={(e) => set({ label: e.target.value })}
                placeholder="Launch offer"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="o-start">Starts (optional)</Label>
                <Input
                  id="o-start"
                  type="datetime-local"
                  value={form.startsAt ?? ""}
                  onChange={(e) => set({ startsAt: e.target.value || undefined })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="o-end">Ends (optional)</Label>
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

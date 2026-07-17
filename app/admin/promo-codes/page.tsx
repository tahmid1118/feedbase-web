"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Loader2, Plus, Ban } from "lucide-react";
import { adminApi, type PromoCode, type CreatePromoInput } from "@/lib/api";
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
import { toast } from "sonner";

const EMPTY: CreatePromoInput = {
  code: "",
  type: "percent_off",
  percentOff: 50,
  appliesToPlan: "any",
  planGrant: "pro",
  duration: "once",
};

function benefit(p: PromoCode): string {
  if (p.type === "percent_off") {
    const scope = p.applies_to_plan && p.applies_to_plan !== "any" ? p.applies_to_plan : "any plan";
    return `${p.percent_off}% off ${scope}`;
  }
  return `Free ${p.plan_grant}`;
}

export default function AdminPromoCodesPage() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const [rows, setRows] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CreatePromoInput>(EMPTY);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await adminApi.listPromoCodes(token);
      setRows(res.data?.rows ?? []);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const set = (patch: Partial<CreatePromoInput>) =>
    setForm((f) => ({ ...f, ...patch }));

  const create = async () => {
    if (!token) return;
    setBusy(true);
    const res = await adminApi.createPromoCode(token, form);
    setBusy(false);
    if (res.ok) {
      toast.success("Promo code created");
      setOpen(false);
      setForm(EMPTY);
      load();
    } else toast.error(res.message || "Failed to create promo code");
  };

  const revoke = async (p: PromoCode) => {
    if (!token) return;
    const res = await adminApi.revokePromoCode(token, p.id);
    if (res.ok) {
      setRows((prev) => prev.map((r) => (r.id === p.id ? { ...r, is_active: 0 } : r)));
      toast.success("Promo code revoked");
    } else toast.error(res.message || "Failed");
  };

  const codeValid = /^[A-Za-z0-9_-]{3,64}$/.test(form.code);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#1c0a0c]">Promo Codes</h2>
          <p className="text-sm text-[#1c0a0c]/60">
            Generate discount and free-plan codes to share with customers.
          </p>
        </div>
        <Button className="bg-[#c74959] text-white hover:bg-[#b03f4d]" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          New code
        </Button>
      </div>

      <Card className="overflow-x-auto p-0">
        {loading ? (
          <div className="py-12 text-center text-[#1c0a0c]/60">{t("common.loading")}</div>
        ) : rows.length === 0 ? (
          <div className="py-12 text-center text-[#1c0a0c]/60">{t("admin.noPromoCodes")}</div>
        ) : (
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-[#e399a3]/20 text-left text-xs uppercase tracking-wide text-[#1c0a0c]/50">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Benefit</th>
                <th className="px-4 py-3">{t("admin.duration")}</th>
                <th className="px-4 py-3">Redeemed</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-b border-[#e399a3]/10">
                  <td className="px-4 py-3 font-mono font-medium text-[#1c0a0c]">{p.code}</td>
                  <td className="px-4 py-3 text-[#1c0a0c]/80">{benefit(p)}</td>
                  <td className="px-4 py-3 text-[#1c0a0c]/70 capitalize">
                    {p.duration}
                    {p.duration === "repeating" && p.duration_months
                      ? ` (${p.duration_months}mo)`
                      : ""}
                  </td>
                  <td className="px-4 py-3 text-[#1c0a0c]/70">
                    {p.times_redeemed}
                    {p.max_redemptions ? ` / ${p.max_redemptions}` : ""}
                  </td>
                  <td className="px-4 py-3">
                    {p.is_active ? (
                      <Badge className="bg-green-100 text-green-700">{t("common.active")}</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[#1c0a0c]/50">
                        Revoked
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {p.is_active === 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => revoke(p)}
                      >
                        <Ban className="h-4 w-4" />
                        Revoke
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>{t("admin.newPromoCode")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="p-code">Code</Label>
              <Input
                id="p-code"
                value={form.code}
                onChange={(e) => set({ code: e.target.value.toUpperCase() })}
                placeholder="SUMMER50"
                className="font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => set({ type: v as CreatePromoInput["type"] })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent_off">Percentage off</SelectItem>
                  <SelectItem value="free_plan">Free plan (comp)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.type === "percent_off" ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="p-pct">Percent off</Label>
                  <Input
                    id="p-pct"
                    type="number"
                    min={1}
                    max={100}
                    value={form.percentOff ?? ""}
                    onChange={(e) => set({ percentOff: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Applies to</Label>
                  <Select value={form.appliesToPlan} onValueChange={(v) => set({ appliesToPlan: v })}>
                    <SelectTrigger className="w-full capitalize">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any plan</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Grant plan</Label>
                <Select value={form.planGrant} onValueChange={(v) => set({ planGrant: v })}>
                  <SelectTrigger className="w-full capitalize">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{t("admin.duration")}</Label>
                <Select value={form.duration} onValueChange={(v) => set({ duration: v })}>
                  <SelectTrigger className="w-full capitalize">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once">Once</SelectItem>
                    <SelectItem value="repeating">Repeating</SelectItem>
                    <SelectItem value="forever">Forever</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.duration === "repeating" && (
                <div className="space-y-2">
                  <Label htmlFor="p-months">Months</Label>
                  <Input
                    id="p-months"
                    type="number"
                    min={1}
                    value={form.durationMonths ?? 1}
                    onChange={(e) => set({ durationMonths: Number(e.target.value) })}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="p-max">Max redemptions</Label>
                <Input
                  id="p-max"
                  type="number"
                  min={1}
                  value={form.maxRedemptions ?? ""}
                  onChange={(e) =>
                    set({ maxRedemptions: e.target.value ? Number(e.target.value) : undefined })
                  }
                  placeholder="Unlimited"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-exp">Expires</Label>
                <Input
                  id="p-exp"
                  type="date"
                  value={form.expiresAt ?? ""}
                  onChange={(e) => set({ expiresAt: e.target.value || undefined })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#c74959] text-white hover:bg-[#b03f4d]"
              disabled={!codeValid || busy}
              onClick={create}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create code"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

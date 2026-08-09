"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Loader2, Plus, Ban, RotateCcw, Trash2 } from "@/components/icons";
import {
  adminApi,
  type PromoCode,
  type CreatePromoInput,
  type ReactivatePromoInput,
} from "@/lib/api";
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
  // The revoked code being reactivated (null = dialog closed) + its new terms.
  const [reactivating, setReactivating] = useState<PromoCode | null>(null);
  const [reForm, setReForm] = useState<ReactivatePromoInput>({});
  // The code queued for permanent deletion (null = dialog closed).
  const [deleting, setDeleting] = useState<PromoCode | null>(null);

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
      toast.success(t("toast.promoCreated"));
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
      toast.success(t("toast.promoRevoked"));
    } else toast.error(res.message || "Failed");
  };

  /** Open the reactivate dialog seeded with the code's current terms. */
  const openReactivate = (p: PromoCode) => {
    setReactivating(p);
    setReForm({
      percentOff: p.percent_off ?? undefined,
      appliesToPlan: p.applies_to_plan ?? "any",
      planGrant: p.plan_grant ?? "pro",
      duration: p.duration,
      durationMonths: p.duration_months ?? undefined,
      maxRedemptions: p.max_redemptions,
      expiresAt: p.expires_at ? p.expires_at.slice(0, 10) : null,
      resetUsage: false,
    });
  };

  const reactivate = async () => {
    if (!token || !reactivating) return;
    setBusy(true);
    const res = await adminApi.reactivatePromoCode(token, reactivating.id, reForm);
    setBusy(false);
    if (res.ok) {
      toast.success(t("toast.promoReactivated"));
      setReactivating(null);
      load();
    } else toast.error(res.message || "Failed to reactivate");
  };

  const remove = async () => {
    if (!token || !deleting) return;
    setBusy(true);
    const res = await adminApi.deletePromoCode(token, deleting.id);
    setBusy(false);
    if (res.ok) {
      toast.success(t("toast.promoDeleted"));
      setDeleting(null);
      load();
    } else toast.error(res.message || "Failed to delete");
  };

  const codeValid = /^[A-Za-z0-9_-]{3,64}$/.test(form.code);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#1c0a0c]">{t("admin.nav.promoCodes")}</h2>
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
                <th className="px-4 py-3">{t("admin.th.code")}</th>
                <th className="px-4 py-3">{t("admin.th.benefit")}</th>
                <th className="px-4 py-3">{t("admin.duration")}</th>
                <th className="px-4 py-3">{t("admin.th.redeemed")}</th>
                <th className="px-4 py-3">{t("common.status")}</th>
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
                    {p.is_active === 1 ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => revoke(p)}
                      >
                        <Ban className="h-4 w-4" />
                        Revoke
                      </Button>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={() => openReactivate(p)}>
                        <RotateCcw className="h-4 w-4" />
                        {t("admin.reactivate")}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => setDeleting(p)}
                      aria-label={t("common.delete")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
              <Label htmlFor="p-code">{t("admin.code")}</Label>
              <Input
                id="p-code"
                value={form.code}
                onChange={(e) => set({ code: e.target.value.toUpperCase() })}
                placeholder="SUMMER50"
                className="font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label>{t("portal.type")}</Label>
              <Select value={form.type} onValueChange={(v) => set({ type: v as CreatePromoInput["type"] })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent_off">{t("admin.percentageOff")}</SelectItem>
                  <SelectItem value="free_plan">{t("admin.freePlanComp")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.type === "percent_off" ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="p-pct">{t("admin.percentOff")}</Label>
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
                  <Label>{t("admin.appliesTo")}</Label>
                  <Select value={form.appliesToPlan} onValueChange={(v) => set({ appliesToPlan: v })}>
                    <SelectTrigger className="w-full capitalize">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">{t("admin.anyPlan")}</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>{t("admin.grantPlan")}</Label>
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

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("admin.duration")}</Label>
                <Select value={form.duration} onValueChange={(v) => set({ duration: v })}>
                  <SelectTrigger className="w-full capitalize">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once">{t("admin.once")}</SelectItem>
                    <SelectItem value="repeating">{t("admin.repeating")}</SelectItem>
                    <SelectItem value="forever">{t("admin.forever")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.duration === "repeating" && (
                <div className="space-y-2">
                  <Label htmlFor="p-months">{t("admin.months")}</Label>
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

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="p-max">{t("admin.maxRedemptions")}</Label>
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
                <Label htmlFor="p-exp">{t("admin.expires")}</Label>
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

      {/* Reactivate a revoked code, optionally on new terms. The code itself is
          never editable — customers may already be holding it. */}
      <Dialog open={!!reactivating} onOpenChange={(o) => !o && setReactivating(null)}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>
              {t("admin.reactivateCode", { code: reactivating?.code ?? "" })}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-[#1c0a0c]/60">{t("admin.reactivateHint")}</p>

            {reactivating?.type === "percent_off" ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>{t("admin.percentOff")}</Label>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={reForm.percentOff ?? ""}
                    onChange={(e) =>
                      setReForm((f) => ({ ...f, percentOff: Number(e.target.value) }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("admin.appliesTo")}</Label>
                  <Select
                    value={reForm.appliesToPlan ?? "any"}
                    onValueChange={(v) => setReForm((f) => ({ ...f, appliesToPlan: v }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">{t("admin.anyPlan")}</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label>{t("admin.planGrant")}</Label>
                <Select
                  value={reForm.planGrant ?? "pro"}
                  onValueChange={(v) => setReForm((f) => ({ ...f, planGrant: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("admin.maxRedemptions")}</Label>
                <Input
                  type="number"
                  min={1}
                  placeholder={t("admin.unlimited")}
                  value={reForm.maxRedemptions ?? ""}
                  onChange={(e) =>
                    setReForm((f) => ({
                      ...f,
                      maxRedemptions: e.target.value === "" ? null : Number(e.target.value),
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("admin.expiresAt")}</Label>
                <Input
                  type="date"
                  value={reForm.expiresAt ?? ""}
                  onChange={(e) =>
                    setReForm((f) => ({ ...f, expiresAt: e.target.value || null }))
                  }
                />
              </div>
            </div>

            <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-[#e399a3]/50 bg-white p-3">
              <input
                type="checkbox"
                className="mt-0.5 accent-[#c74959]"
                checked={reForm.resetUsage ?? false}
                onChange={(e) => setReForm((f) => ({ ...f, resetUsage: e.target.checked }))}
              />
              <span className="text-sm">
                <span className="font-medium text-[#1c0a0c]">{t("admin.resetUsage")}</span>
                <span className="block text-xs text-[#1c0a0c]/60">
                  {t("admin.resetUsageHint", { count: reactivating?.times_redeemed ?? 0 })}
                </span>
              </span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReactivating(null)} disabled={busy}>
              {t("common.cancel")}
            </Button>
            <Button
              className="bg-[#c74959] text-white hover:bg-[#b03f4d]"
              onClick={reactivate}
              disabled={busy}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t("admin.reactivate")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Permanent delete. Names the redemption records that go with it — that
          history is the only trace of who received a comp or discount. */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("admin.deleteCodeTitle", { code: deleting?.code ?? "" })}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-[#1c0a0c]/70">
                <span className="block">{t("admin.deleteCodeBody")}</span>
                {deleting && deleting.times_redeemed > 0 && (
                  <span className="block rounded-lg bg-red-50 px-3 py-2 text-red-800">
                    {t("admin.deleteCodeRedeemed", { count: deleting.times_redeemed })}
                  </span>
                )}
                <span className="block text-xs">{t("admin.deleteCodeKeepsPlans")}</span>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); remove(); }}
              disabled={busy}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

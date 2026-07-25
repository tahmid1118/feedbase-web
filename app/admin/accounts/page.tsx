"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Search, BadgeCheck } from "lucide-react";
import { adminApi, type AdminAccount } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n/client";
import { Input } from "@/components/ui/input";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { LocalTime } from "@/components/local-time";
import { toast } from "sonner";

const PLANS = ["free", "pro", "business"];

// Comp duration choices offered when granting a paid plan. "0" months = lifetime
// (never expires); a positive value expires the comp after that many months.
const DURATIONS = [
  { value: "0", labelKey: "admin.durationLifetime" },
  { value: "1", labelKey: "admin.durationM1" },
  { value: "3", labelKey: "admin.durationM3" },
  { value: "6", labelKey: "admin.durationM6" },
  { value: "12", labelKey: "admin.durationM12" },
];

export default function AdminAccountsPage() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const [rows, setRows] = useState<AdminAccount[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  // Pending paid-plan grant awaiting a duration choice in the dialog.
  const [pendingGrant, setPendingGrant] = useState<{
    account: AdminAccount;
    plan: string;
  } | null>(null);
  const [grantMonths, setGrantMonths] = useState("0");

  const load = useCallback(
    async (q?: string) => {
      if (!token) return;
      try {
        setLoading(true);
        const res = await adminApi.listAccounts(token, q);
        setRows(res.data?.rows ?? []);
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    load();
  }, [load]);

  // Revoking to free applies immediately; granting a paid plan opens the
  // duration dialog first (lifetime vs N-month comp).
  const selectPlan = (a: AdminAccount, plan: string) => {
    if (plan === a.plan_name) return;
    if (plan === "free") {
      changePlan(a, plan);
    } else {
      setGrantMonths("0");
      setPendingGrant({ account: a, plan });
    }
  };

  const changePlan = async (a: AdminAccount, plan: string, durationMonths?: number) => {
    if (!token || plan === a.plan_name) return;
    const res = await adminApi.setAccountPlan(token, a.email, plan, durationMonths);
    if (res.ok) {
      setRows((prev) =>
        prev.map((r) =>
          r.email === a.email
            ? { ...r, plan_name: plan, subscription_status: plan === "free" ? null : "comped" }
            : r
        )
      );
      toast.success(t("admin.planUpdated"));
    } else toast.error(res.message || t("admin.planUpdateFailed"));
  };

  const confirmGrant = async () => {
    if (!pendingGrant) return;
    const months = Number(grantMonths);
    await changePlan(pendingGrant.account, pendingGrant.plan, months > 0 ? months : undefined);
    setPendingGrant(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#1c0a0c]">{t("admin.nav.accounts")}</h2>
        <p className="text-sm text-[#1c0a0c]/60">{t("admin.accountsSubtitle")}</p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          load(search);
        }}
        className="flex max-w-md gap-2"
      >
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("admin.searchAccounts")}
        />
        <Button type="submit" variant="outline">
          <Search className="h-4 w-4" />
        </Button>
      </form>

      <Card className="overflow-x-auto p-0">
        {loading ? (
          <div className="py-12 text-center text-[#1c0a0c]/60">{t("common.loading")}</div>
        ) : rows.length === 0 ? (
          <div className="py-12 text-center text-[#1c0a0c]/60">{t("admin.noAccounts")}</div>
        ) : (
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-[#e399a3]/20 text-left text-xs uppercase tracking-wide text-[#1c0a0c]/50">
              <tr>
                <th className="px-4 py-3">{t("admin.th.account")}</th>
                <th className="px-4 py-3">{t("admin.th.workspaces")}</th>
                <th className="px-4 py-3">{t("admin.th.plan")}</th>
                <th className="px-4 py-3">{t("admin.th.renews")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.email} className="border-b border-[#e399a3]/10">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 font-medium text-[#1c0a0c]">
                      {a.name || a.email}
                      {a.is_platform_admin ? (
                        <BadgeCheck className="h-4 w-4 text-[#c74959]" />
                      ) : null}
                    </div>
                    <div className="text-xs text-[#1c0a0c]/50">{a.email}</div>
                  </td>
                  <td className="px-4 py-3 text-[#1c0a0c]/70">
                    <div>{t("admin.nWorkspaces", { count: a.owned_count })}</div>
                    {a.workspaces && (
                      <div className="text-xs text-[#1c0a0c]/50">{a.workspaces}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Select value={a.plan_name} onValueChange={(v) => selectPlan(a, v)}>
                        <SelectTrigger className="h-8 w-[120px] capitalize">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PLANS.map((p) => (
                            <SelectItem key={p} value={p} className="capitalize">
                              {p}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {a.subscription_status === "comped" && (
                        <Badge variant="outline" className="text-[10px]">
                          comped
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#1c0a0c]/60">
                    {a.current_period_end ? <LocalTime date={a.current_period_end} /> : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* Comp-duration picker shown when granting a paid plan. */}
      <AlertDialog
        open={pendingGrant !== null}
        onOpenChange={(open) => {
          if (!open) setPendingGrant(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="capitalize">
              {t("admin.grantToAccount", {
                plan: pendingGrant?.plan,
                account: pendingGrant?.account.name || pendingGrant?.account.email,
              })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("admin.grantAccountDesc", {
                count: pendingGrant?.account.owned_count ?? 0,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#1c0a0c]/80">{t("admin.duration")}</label>
            <Select value={grantMonths} onValueChange={setGrantMonths}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DURATIONS.map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    {t(d.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmGrant}>{t("admin.grantPlan")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

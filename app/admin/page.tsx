"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Building2, Users, MessageSquare, CreditCard, Ticket } from "lucide-react";
import { adminApi, type OverviewData } from "@/lib/api";
import { Card } from "@/components/ui/card";

const PLAN_LABEL: Record<string, string> = {
  free: "Free",
  pro: "Pro",
  business: "Business",
};

export default function AdminOverviewPage() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    adminApi
      .overview(token)
      .then((res) => setData(res.data ?? null))
      .finally(() => setLoading(false));
  }, [token]);

  const stats = [
    { label: "Workspaces", value: data?.tenants, icon: Building2, hint: `${data?.active_tenants ?? 0} active` },
    { label: "Users", value: data?.users, icon: Users },
    { label: "Posts", value: data?.posts, icon: MessageSquare },
    { label: "Paid subscriptions", value: data?.paid_subs, icon: CreditCard },
    { label: "Promo redemptions", value: data?.redemptions, icon: Ticket },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#1c0a0c]">Overview</h2>
        <p className="text-sm text-[#1c0a0c]/60">
          Platform-wide activity across all workspaces.
        </p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-[#1c0a0c]/60">Loading…</div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stats.map((s) => (
              <Card key={s.label} className="p-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#c74959]/10 text-[#c74959]">
                    <s.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-2xl font-bold text-[#1c0a0c]">{s.value ?? 0}</p>
                    <p className="text-xs text-[#1c0a0c]/60">
                      {s.label}
                      {s.hint ? ` · ${s.hint}` : ""}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Card className="p-5">
            <h3 className="mb-3 text-sm font-semibold text-[#1c0a0c]">Plan breakdown</h3>
            <div className="flex flex-wrap gap-3">
              {(data?.plan_breakdown ?? []).map((p) => (
                <div
                  key={p.plan_name}
                  className="rounded-lg border border-[#e399a3]/30 bg-[#fdf8f9] px-4 py-2"
                >
                  <span className="text-lg font-bold text-[#1c0a0c]">{p.n}</span>{" "}
                  <span className="text-sm text-[#1c0a0c]/60">
                    {PLAN_LABEL[p.plan_name] ?? p.plan_name}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

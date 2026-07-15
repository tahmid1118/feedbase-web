"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Search, Trash2, MessageSquare } from "lucide-react";
import { adminApi, type AdminWorkspace } from "@/lib/api";
import { Card } from "@/components/ui/card";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { LocalTime } from "@/components/local-time";
import { toast } from "sonner";

const PLANS = ["free", "pro", "business"];

// Comp duration choices offered when granting a paid plan. "0" months = lifetime
// (never expires); a positive value expires the comp after that many months.
const DURATIONS = [
  { value: "0", label: "Lifetime (never expires)" },
  { value: "1", label: "1 month" },
  { value: "3", label: "3 months" },
  { value: "6", label: "6 months" },
  { value: "12", label: "12 months" },
];

export default function AdminWorkspacesPage() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const [rows, setRows] = useState<AdminWorkspace[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  // Pending paid-plan grant awaiting a duration choice in the dialog.
  const [pendingGrant, setPendingGrant] = useState<{
    workspace: AdminWorkspace;
    plan: string;
  } | null>(null);
  const [grantMonths, setGrantMonths] = useState("0");

  const load = useCallback(
    async (q?: string) => {
      if (!token) return;
      try {
        setLoading(true);
        const res = await adminApi.listWorkspaces(token, q);
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
  const selectPlan = (w: AdminWorkspace, plan: string) => {
    if (plan === w.plan_name) return;
    if (plan === "free") {
      changePlan(w, plan);
    } else {
      setGrantMonths("0");
      setPendingGrant({ workspace: w, plan });
    }
  };

  const changePlan = async (w: AdminWorkspace, plan: string, durationMonths?: number) => {
    if (!token || plan === w.plan_name) return;
    const res = await adminApi.setWorkspacePlan(token, w.id, plan, durationMonths);
    if (res.ok) {
      setRows((prev) =>
        prev.map((r) =>
          r.id === w.id
            ? { ...r, plan_name: plan, subscription_status: plan === "free" ? null : "comped" }
            : r
        )
      );
      const suffix =
        plan === "free" || !durationMonths ? "" : ` for ${durationMonths} month${durationMonths === 1 ? "" : "s"}`;
      toast.success(`Plan set to ${plan}${suffix}`);
    } else toast.error(res.message || "Failed to update plan");
  };

  const confirmGrant = async () => {
    if (!pendingGrant) return;
    const months = Number(grantMonths);
    await changePlan(pendingGrant.workspace, pendingGrant.plan, months > 0 ? months : undefined);
    setPendingGrant(null);
  };

  const toggleActive = async (w: AdminWorkspace) => {
    if (!token) return;
    const next = w.is_active ? false : true;
    const res = await adminApi.updateWorkspace(token, w.id, { isActive: next });
    if (res.ok) {
      setRows((prev) =>
        prev.map((r) => (r.id === w.id ? { ...r, is_active: next ? 1 : 0 } : r))
      );
      toast.success(next ? "Workspace activated" : "Workspace deactivated");
    } else toast.error(res.message || "Failed");
  };

  const remove = async (w: AdminWorkspace) => {
    if (!token) return;
    const res = await adminApi.deleteWorkspace(token, w.id);
    if (res.ok) {
      setRows((prev) => prev.filter((r) => r.id !== w.id));
      toast.success("Workspace deleted");
    } else toast.error(res.message || "Failed to delete");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#1c0a0c]">Workspaces</h2>
        <p className="text-sm text-[#1c0a0c]/60">
          Every workspace across the platform. Grant plans, deactivate, or delete.
        </p>
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
          placeholder="Search name, subdomain, domain…"
        />
        <Button type="submit" variant="outline">
          <Search className="h-4 w-4" />
        </Button>
      </form>

      <Card className="overflow-x-auto p-0">
        {loading ? (
          <div className="py-12 text-center text-[#1c0a0c]/60">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="py-12 text-center text-[#1c0a0c]/60">No workspaces.</div>
        ) : (
          <table className="w-full min-w-[820px] text-sm">
            <thead className="border-b border-[#e399a3]/20 text-left text-xs uppercase tracking-wide text-[#1c0a0c]/50">
              <tr>
                <th className="px-4 py-3">Workspace</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Members</th>
                <th className="px-4 py-3">Posts</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((w) => (
                <tr key={w.id} className="border-b border-[#e399a3]/10">
                  <td className="px-4 py-3">
                    <div className="font-medium text-[#1c0a0c]">{w.name}</div>
                    <div className="text-xs text-[#1c0a0c]/50">
                      {w.custom_domain || `${w.subdomain}`}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#1c0a0c]/70">{w.owner_email || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Select value={w.plan_name} onValueChange={(v) => selectPlan(w, v)}>
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
                      {w.subscription_status === "comped" && (
                        <Badge variant="outline" className="text-[10px]">
                          comped
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#1c0a0c]/70">{w.user_count}</td>
                  <td className="px-4 py-3 text-[#1c0a0c]/70">{w.post_count}</td>
                  <td className="px-4 py-3 text-[#1c0a0c]/60">
                    <LocalTime date={w.created_at} />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleActive(w)}
                      className={
                        w.is_active
                          ? "rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700"
                          : "rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600"
                      }
                    >
                      {w.is_active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/workspaces/${w.id}`}>
                        <MessageSquare className="h-4 w-4" />
                        Posts
                      </Link>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete {w.name}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This permanently removes the workspace and all of its
                            users, posts, and data. This cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction variant="destructive" onClick={() => remove(w)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    </div>
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
              Grant {pendingGrant?.plan} to {pendingGrant?.workspace.name}
            </AlertDialogTitle>
            <AlertDialogDescription>
              This comps the workspace onto {pendingGrant?.plan} at no charge (any
              live Stripe subscription is cancelled). Choose how long the comp
              lasts — after that it reverts to Free automatically.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#1c0a0c]/80">Duration</label>
            <Select value={grantMonths} onValueChange={setGrantMonths}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DURATIONS.map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmGrant}>Grant plan</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

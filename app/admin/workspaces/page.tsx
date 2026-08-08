"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Search, Trash2, MessageSquare, ExternalLink } from "lucide-react";
import { adminApi, type AdminWorkspace } from "@/lib/api";
import { portalUrlForSubdomain } from "@/lib/official-board";
import { Card } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

export default function AdminWorkspacesPage() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const [rows, setRows] = useState<AdminWorkspace[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

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
      toast.success(t("toast.workspaceDeleted"));
    } else toast.error(res.message || "Failed to delete");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#1c0a0c]">{t("admin.nav.workspaces")}</h2>
        <p className="text-sm text-[#1c0a0c]/60">
          {t("admin.workspacesSubtitle")}
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
          placeholder={t("admin.searchWorkspaces")}
        />
        <Button type="submit" variant="outline">
          <Search className="h-4 w-4" />
        </Button>
      </form>

      <Card className="overflow-x-auto p-0">
        {loading ? (
          <div className="py-12 text-center text-[#1c0a0c]/60">{t("common.loading")}</div>
        ) : rows.length === 0 ? (
          <div className="py-12 text-center text-[#1c0a0c]/60">{t("admin.noWorkspaces")}</div>
        ) : (
          <table className="w-full min-w-[820px] text-sm">
            <thead className="border-b border-[#e399a3]/20 text-left text-xs uppercase tracking-wide text-[#1c0a0c]/50">
              <tr>
                <th className="px-4 py-3">{t("admin.th.workspace")}</th>
                <th className="px-4 py-3">{t("admin.th.owner")}</th>
                <th className="px-4 py-3">{t("admin.th.plan")}</th>
                <th className="px-4 py-3">{t("admin.th.members")}</th>
                <th className="px-4 py-3">{t("admin.th.posts")}</th>
                <th className="px-4 py-3">{t("admin.th.created")}</th>
                <th className="px-4 py-3">{t("common.status")}</th>
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
                    {/* Read-only — the plan is set per ACCOUNT in the Accounts tab. */}
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="capitalize">
                        {w.plan_name}
                      </Badge>
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
                    {/* Jump straight to the workspace's public board. Always
                        built from the subdomain, never `custom_domain` — the
                        proxy doesn't route custom-domain hosts to a portal
                        (see proxy.ts), so that would be a dead link. */}
                    <Button asChild variant="outline" size="icon" title="Open public board">
                      <a
                        href={portalUrlForSubdomain(w.subdomain)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span className="sr-only">Open public board</span>
                      </a>
                    </Button>
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
                          <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
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
    </div>
  );
}

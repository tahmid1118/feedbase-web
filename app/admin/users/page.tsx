"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { KeyRound, Loader2, Search, ShieldCheck, Trash2 } from "lucide-react";
import {
  adminApi,
  type AdminUserRow,
  type AdminUserDeletionSummary,
} from "@/lib/api";
import { Card } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { toast } from "sonner";

const ROLES = ["owner", "user"];

export default function AdminUsersPage() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [pwUser, setPwUser] = useState<AdminUserRow | null>(null);
  const [pw, setPw] = useState("");
  // Deletion is account-scoped and irreversible, so the dialog loads a summary
  // from the server first and the admin confirms against the real consequences.
  const [delUser, setDelUser] = useState<AdminUserRow | null>(null);
  const [delSummary, setDelSummary] = useState<AdminUserDeletionSummary | null>(null);
  const [delLoading, setDelLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(
    async (q?: string) => {
      if (!token) return;
      try {
        setLoading(true);
        const res = await adminApi.listUsers(token, q);
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

  const changeRole = async (u: AdminUserRow, role: string) => {
    if (!token || role === u.role) return;
    const res = await adminApi.updateUser(token, u.id, { role });
    if (res.ok) {
      setRows((prev) => prev.map((r) => (r.id === u.id ? { ...r, role } : r)));
      toast.success(t("toast.roleUpdated"));
    } else toast.error(res.message || "Failed");
  };

  const toggleActive = async (u: AdminUserRow) => {
    if (!token) return;
    const next = u.is_active ? false : true;
    const res = await adminApi.updateUser(token, u.id, { isActive: next });
    if (res.ok) {
      setRows((prev) => prev.map((r) => (r.id === u.id ? { ...r, is_active: next ? 1 : 0 } : r)));
      toast.success(next ? "User activated" : "User deactivated");
    } else toast.error(res.message || "Failed");
  };

  const openDelete = async (u: AdminUserRow) => {
    if (!token) return;
    setDelUser(u);
    setDelSummary(null);
    setDelLoading(true);
    try {
      const res = await adminApi.getUserDeletionSummary(token, u.id);
      if (res.ok && res.data) setDelSummary(res.data);
      else toast.error(res.message || "Could not load what would be deleted");
    } finally {
      setDelLoading(false);
    }
  };

  const remove = async () => {
    if (!token || !delUser) return;
    setDeleting(true);
    try {
      const res = await adminApi.deleteUser(token, delUser.id);
      if (res.ok) {
        // The whole account went, so drop every row sharing its email.
        const email = delUser.email;
        setRows((prev) => prev.filter((r) => r.email !== email));
        toast.success(res.message || t("toast.userDeleted"));
        setDelUser(null);
      } else toast.error(res.message || "Failed");
    } finally {
      setDeleting(false);
    }
  };

  const resetPw = async () => {
    if (!token || !pwUser) return;
    const res = await adminApi.resetUserPassword(token, pwUser.id, pw);
    if (res.ok) {
      toast.success(t("toast.passwordReset"));
      setPwUser(null);
      setPw("");
    } else toast.error(res.message || "Failed to reset password");
  };

  // One account (email) can belong to multiple workspaces — each is a separate
  // membership row. Group by email so a person appears once, with each of their
  // workspace memberships listed (and managed) beneath.
  const groups = useMemo(() => {
    const map = new Map<string, AdminUserRow[]>();
    for (const u of rows) {
      const arr = map.get(u.email);
      if (arr) arr.push(u);
      else map.set(u.email, [u]);
    }
    return Array.from(map.values());
  }, [rows]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#1c0a0c]">{t("admin.nav.users")}</h2>
        <p className="text-sm text-[#1c0a0c]/60">
          Every user across all workspaces. Change roles, reset passwords, or remove.
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
          placeholder={t("admin.searchUsers")}
        />
        <Button type="submit" variant="outline">
          <Search className="h-4 w-4" />
        </Button>
      </form>

      <Card className="overflow-x-auto p-0">
        {loading ? (
          <div className="py-12 text-center text-[#1c0a0c]/60">{t("common.loading")}</div>
        ) : rows.length === 0 ? (
          <div className="py-12 text-center text-[#1c0a0c]/60">{t("admin.noUsers")}</div>
        ) : (
          <table className="w-full min-w-[780px] text-sm">
            <thead className="border-b border-[#e399a3]/20 text-left text-xs uppercase tracking-wide text-[#1c0a0c]/50">
              <tr>
                <th className="px-4 py-3">{t("admin.th.user")}</th>
                <th className="px-4 py-3">{t("admin.th.workspace")}</th>
                <th className="px-4 py-3">{t("admin.th.role")}</th>
                <th className="px-4 py-3">{t("common.status")}</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => {
                const person = group[0];
                const isAdmin = group.some((u) => u.is_platform_admin === 1);
                return (
                  <Fragment key={person.email}>
                    {group.map((u, i) => (
                      <tr key={u.id} className="border-b border-[#e399a3]/10">
                        {i === 0 && (
                          <td
                            className="px-4 py-3 align-top"
                            rowSpan={group.length}
                          >
                            <div className="font-medium text-[#1c0a0c]">
                              {person.full_name}
                            </div>
                            <div className="text-xs text-[#1c0a0c]/50">
                              {person.email}
                            </div>
                            {isAdmin && (
                              <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-[#c74959]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#c74959]">
                                <ShieldCheck className="h-3 w-3" />
                                Platform admin
                              </div>
                            )}
                            {group.length > 1 && (
                              <div className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-[#c74959]">
                                {group.length} workspaces
                              </div>
                            )}
                          </td>
                        )}
                        <td className="px-4 py-3 text-[#1c0a0c]/70">
                          {u.workspace_name || (
                            // Not a broken row: an account exists before it
                            // onboards a workspace, and the platform-admin
                            // identity lives on exactly such a row.
                            <span className="text-xs italic text-[#1c0a0c]/40">
                              No workspace
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Select
                            value={u.role ?? "user"}
                            onValueChange={(v) => changeRole(u, v)}
                          >
                            <SelectTrigger className="h-8 w-[110px] capitalize">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ROLES.map((r) => (
                                <SelectItem key={r} value={r} className="capitalize">
                                  {r}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => toggleActive(u)}
                            className={
                              u.is_active
                                ? "rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700"
                                : "rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600"
                            }
                          >
                            {u.is_active ? "Active" : "Inactive"}
                          </button>
                        </td>
                        {/* Password and deletion are ACCOUNT-scoped, not
                            per-membership, so they render once per person. */}
                        {i === 0 && (
                          <td className="px-4 py-3 align-top" rowSpan={group.length}>
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Reset password"
                                onClick={() => {
                                  setPwUser(person);
                                  setPw("");
                                }}
                              >
                                <KeyRound className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-600 hover:text-red-700 disabled:opacity-40"
                                disabled={isAdmin}
                                title={
                                  isAdmin
                                    ? "Platform admins can't be deleted here — remove the admin role under Admins first"
                                    : "Delete account"
                                }
                                onClick={() => openDelete(person)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      <AlertDialog open={!!pwUser} onOpenChange={(o) => !o && setPwUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.resetPassword")}</AlertDialogTitle>
            <AlertDialogDescription>
              Set a new password for {pwUser?.email}. Minimum 8 characters.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            type="text"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="New password"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction disabled={pw.length < 8} onClick={resetPw}>
              Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Account deletion. Irreversible and wider than the row that triggered
          it, so it never fires until the server has said exactly what dies. */}
      <AlertDialog open={!!delUser} onOpenChange={(o) => !o && !deleting && setDelUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {delUser?.full_name}&apos;s account?</AlertDialogTitle>
            <AlertDialogDescription>
              This deletes the entire account for{" "}
              <span className="font-medium text-[#1c0a0c]">{delUser?.email}</span>, not
              just one workspace membership. It cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {delLoading ? (
            <div className="flex items-center gap-2 py-4 text-sm text-[#1c0a0c]/60">
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking what would be deleted…
            </div>
          ) : delSummary ? (
            <div className="space-y-3 text-sm">
              {delSummary.ownedWorkspaces.length > 0 && (
                <div className="rounded-xl border border-[#c74959]/30 bg-[#c74959]/5 p-3">
                  <div className="font-medium text-[#8f2f3b]">
                    {delSummary.ownedWorkspaces.length} workspace
                    {delSummary.ownedWorkspaces.length === 1 ? "" : "s"} will be destroyed
                  </div>
                  <ul className="mt-1 space-y-0.5 text-xs text-[#1c0a0c]/70">
                    {delSummary.ownedWorkspaces.map((w) => (
                      <li key={w.id}>
                        <span className="font-medium">{w.name}</span> — {w.postCount} post
                        {w.postCount === 1 ? "" : "s"}, {w.memberCount} member
                        {w.memberCount === 1 ? "" : "s"} lose access
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {delSummary.memberWorkspaces.length > 0 && (
                <div className="rounded-xl border border-[#e399a3]/40 bg-[#fdf8f9] p-3">
                  <div className="font-medium text-[#1c0a0c]">
                    Shared workspaces survive
                  </div>
                  <div className="mt-0.5 text-xs text-[#1c0a0c]/70">
                    Leaves {delSummary.memberWorkspaces.map((w) => w.name).join(", ")}.
                    Their posts and comments stay, but become anonymous.
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-[#e399a3]/40 bg-[#fdf8f9] p-3">
                <div className="font-medium text-[#1c0a0c]">Billing</div>
                <div className="mt-0.5 text-xs text-[#1c0a0c]/70">
                  {delSummary.billing?.hasLiveSubscription
                    ? `Live ${delSummary.billing.plan ?? ""} subscription is cancelled immediately, then the billing record is removed.`
                    : "No live subscription. Any billing record, device sessions, password resets and pending invitations are removed."}
                </div>
              </div>
            </div>
          ) : null}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={delLoading || deleting || !delSummary || delSummary.isPlatformAdmin}
              onClick={(e) => {
                e.preventDefault();
                remove();
              }}
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting…
                </>
              ) : (
                "Delete account"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { KeyRound, Search, Trash2 } from "lucide-react";
import { adminApi, type AdminUserRow } from "@/lib/api";
import { Card } from "@/components/ui/card";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const ROLES = ["owner", "user"];

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [pwUser, setPwUser] = useState<AdminUserRow | null>(null);
  const [pw, setPw] = useState("");

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
      toast.success("Role updated");
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

  const remove = async (u: AdminUserRow) => {
    if (!token) return;
    const res = await adminApi.deleteUser(token, u.id);
    if (res.ok) {
      setRows((prev) => prev.filter((r) => r.id !== u.id));
      toast.success("User deleted");
    } else toast.error(res.message || "Failed");
  };

  const resetPw = async () => {
    if (!token || !pwUser) return;
    const res = await adminApi.resetUserPassword(token, pwUser.id, pw);
    if (res.ok) {
      toast.success("Password reset");
      setPwUser(null);
      setPw("");
    } else toast.error(res.message || "Failed to reset password");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#1c0a0c]">Users</h2>
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
          placeholder="Search name or email…"
        />
        <Button type="submit" variant="outline">
          <Search className="h-4 w-4" />
        </Button>
      </form>

      <Card className="overflow-x-auto p-0">
        {loading ? (
          <div className="py-12 text-center text-[#1c0a0c]/60">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="py-12 text-center text-[#1c0a0c]/60">No users.</div>
        ) : (
          <table className="w-full min-w-[780px] text-sm">
            <thead className="border-b border-[#e399a3]/20 text-left text-xs uppercase tracking-wide text-[#1c0a0c]/50">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Workspace</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id} className="border-b border-[#e399a3]/10">
                  <td className="px-4 py-3">
                    <div className="font-medium text-[#1c0a0c]">{u.full_name}</div>
                    <div className="text-xs text-[#1c0a0c]/50">{u.email}</div>
                  </td>
                  <td className="px-4 py-3 text-[#1c0a0c]/70">
                    {u.workspace_name || "—"}
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
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Reset password"
                        onClick={() => {
                          setPwUser(u);
                          setPw("");
                        }}
                      >
                        <KeyRound className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete {u.full_name}?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This permanently removes the user account. This cannot
                              be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction variant="destructive" onClick={() => remove(u)}>
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

      <AlertDialog open={!!pwUser} onOpenChange={(o) => !o && setPwUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset password</AlertDialogTitle>
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
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={pw.length < 8} onClick={resetPw}>
              Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { adminApi, type AdminRow } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { LocalTime } from "@/components/local-time";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export default function AdminAdminsPage() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const selfId = session?.user?.adminId ? Number(session.user.adminId) : null;
  const [rows, setRows] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ fullName: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await adminApi.listAdmins(token);
      setRows(res.data?.rows ?? []);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const create = async () => {
    if (!token) return;
    setBusy(true);
    const res = await adminApi.createAdmin(token, form);
    setBusy(false);
    if (res.ok) {
      toast.success(t("toast.adminCreated"));
      setOpen(false);
      setForm({ fullName: "", email: "", password: "" });
      load();
    } else toast.error(res.message || "Failed to create admin");
  };

  const toggleActive = async (a: AdminRow) => {
    if (!token) return;
    const next = a.is_active ? false : true;
    const res = await adminApi.setAdminActive(token, a.id, next);
    if (res.ok) {
      setRows((prev) => prev.map((r) => (r.id === a.id ? { ...r, is_active: next ? 1 : 0 } : r)));
    } else toast.error(res.message || "Failed");
  };

  const remove = async (a: AdminRow) => {
    if (!token) return;
    const res = await adminApi.deleteAdmin(token, a.id);
    if (res.ok) {
      setRows((prev) => prev.filter((r) => r.id !== a.id));
      toast.success(t("toast.adminRemoved"));
    } else toast.error(res.message || "Failed");
  };

  const canCreate =
    form.fullName.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) && form.password.length >= 8;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#1c0a0c]">{t("admin.nav.admins")}</h2>
          <p className="text-sm text-[#1c0a0c]/60">
            Platform operators with full access. Only admins can create admins.
          </p>
        </div>
        <Button className="bg-[#c74959] text-white hover:bg-[#b03f4d]" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          New admin
        </Button>
      </div>

      <Card className="overflow-x-auto p-0">
        {loading ? (
          <div className="py-12 text-center text-[#1c0a0c]/60">{t("common.loading")}</div>
        ) : (
          <table className="w-full min-w-[620px] text-sm">
            <thead className="border-b border-[#e399a3]/20 text-left text-xs uppercase tracking-wide text-[#1c0a0c]/50">
              <tr>
                <th className="px-4 py-3">{t("admin.th.admin")}</th>
                <th className="px-4 py-3">{t("admin.th.lastLogin")}</th>
                <th className="px-4 py-3">{t("common.status")}</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => {
                const isSelf = selfId != null && a.id === selfId;
                return (
                  <tr key={a.id} className="border-b border-[#e399a3]/10">
                    <td className="px-4 py-3">
                      <div className="font-medium text-[#1c0a0c]">
                        {a.full_name}
                        {isSelf && (
                          <span className="ml-2 text-xs text-[#c74959]">(you)</span>
                        )}
                      </div>
                      <div className="text-xs text-[#1c0a0c]/50">{a.email}</div>
                    </td>
                    <td className="px-4 py-3 text-[#1c0a0c]/60">
                      {a.last_login_at ? <LocalTime date={a.last_login_at} relative /> : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        disabled={isSelf}
                        onClick={() => toggleActive(a)}
                        className={
                          (a.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600") +
                          " rounded-full px-2 py-0.5 text-xs font-medium disabled:opacity-50"
                        }
                      >
                        {a.is_active ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!isSelf && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove {a.full_name}?</AlertDialogTitle>
                              <AlertDialogDescription>
                                They will lose all admin access immediately.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                              <AlertDialogAction variant="destructive" onClick={() => remove(a)}>
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
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
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>{t("admin.newAdmin")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="a-name">{t("auth.fullName")}</Label>
              <Input
                id="a-name"
                value={form.fullName}
                onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="a-email">{t("auth.email")}</Label>
              <Input
                id="a-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="a-pw">{t("auth.password")}</Label>
              <Input
                id="a-pw"
                type="text"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="Min 8 characters"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#c74959] text-white hover:bg-[#b03f4d]"
              disabled={!canCreate || busy}
              onClick={create}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create admin"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

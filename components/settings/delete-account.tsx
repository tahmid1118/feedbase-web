"use client";

import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import {
  usersApi,
  ApiError,
  type AccountDeletionSummary,
} from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const CONFIRM_WORD = "DELETE";

/**
 * Danger zone: permanently delete the account. Workspaces the account OWNS are
 * destroyed with it (a workspace has exactly one owner and can't be transferred),
 * so the dialog spells out exactly what will be lost before anything happens.
 */
export function DeleteAccount() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const token = session?.user?.accessToken;

  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState<AccountDeletionSummary | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open || !token || loaded) return;
    usersApi
      .getDeletionSummary(token)
      .then((res) => setSummary(res.data ?? null))
      .catch(() => toast.error("Could not load account details"))
      .finally(() => setLoaded(true));
  }, [open, token, loaded]);

  const loading = open && !loaded;

  const owned = summary?.ownedWorkspaces ?? [];
  const joined = summary?.memberWorkspaces ?? [];
  const canDelete = password.length > 0 && confirm === CONFIRM_WORD && !busy;

  const remove = async () => {
    if (!token || !canDelete) return;
    setBusy(true);
    try {
      await usersApi.deleteAccount(password, token);
      toast.success("Your account has been deleted");
      // Nothing left to come back to — end the session.
      await signOut({ callbackUrl: "/" });
    } catch (e) {
      toast.error(
        e instanceof ApiError ? e.message : "Failed to delete the account"
      );
      setBusy(false);
    }
  };

  return (
    <>
      <Card className="border-red-200 p-6">
        <h3 className="text-lg font-semibold text-red-700">{t("delete.dangerZone")}</h3>
        <p className="mt-1 text-sm text-[#1c0a0c]/60">
          Permanently delete your account. Workspaces you own are deleted with it,
          along with all of their feedback, roadmap, and changelog. This cannot be
          undone.
        </p>
        <div className="mt-4">
          <Button
            variant="outline"
            className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={() => setOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            Delete account
          </Button>
        </div>
      </Card>

      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) {
            setPassword("");
            setConfirm("");
          }
        }}
      >
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="text-red-700">
              Delete your account permanently?
            </DialogTitle>
            <DialogDescription>
              This cannot be undone. Please read carefully.
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="py-8 text-center text-[#1c0a0c]/60">
              <Loader2 className="mx-auto h-5 w-5 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {owned.length > 0 && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                  <p className="flex items-center gap-1.5 text-sm font-semibold text-red-700">
                    <AlertTriangle className="h-4 w-4" />
                    {owned.length === 1
                      ? "1 workspace you own will be deleted"
                      : `${owned.length} workspaces you own will be deleted`}
                  </p>
                  <ul className="mt-2 space-y-1">
                    {owned.map((w) => (
                      <li key={w.id} className="text-sm text-red-700/90">
                        <span className="font-medium">{w.name}</span>{" "}
                        <span className="text-red-700/70">
                          — {w.postCount} post{w.postCount === 1 ? "" : "s"},{" "}
                          {w.memberCount} member{w.memberCount === 1 ? "" : "s"}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-xs text-red-700/80">
                    All of their feedback, comments, roadmap and changelog will be
                    erased, every member loses access, and any active subscription
                    is cancelled.
                  </p>
                </div>
              )}

              {joined.length > 0 && (
                <div className="rounded-lg border border-[#e399a3]/30 bg-[#fdf8f9] p-3">
                  <p className="text-sm font-medium text-[#1c0a0c]">
                    You&apos;ll be removed from {joined.length} shared workspace
                    {joined.length === 1 ? "" : "s"}
                  </p>
                  <p className="mt-1 text-xs text-[#1c0a0c]/60">
                    {joined.map((w) => w.name).join(", ")} — these workspaces keep
                    their data; your posts and comments there stay but become
                    anonymous.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="da-pw">{t("delete.confirmPassword")}</Label>
                <Input
                  id="da-pw"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("delete.yourPassword")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="da-confirm">
                  Type <span className="font-mono font-semibold">{CONFIRM_WORD}</span>{" "}
                  to confirm
                </Label>
                <Input
                  id="da-confirm"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder={CONFIRM_WORD}
                  className="font-mono"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!canDelete}
              onClick={remove}
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t("delete.deleteMyAccount")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

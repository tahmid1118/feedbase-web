"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2, Mail, Send, X } from "lucide-react";
import {
  usersApi,
  invitationsApi,
  extractRows,
  ApiError,
  type User,
  type Invitation,
} from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/client";
import { Input } from "@/components/ui/input";
import { LocalTime } from "@/components/local-time";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

export function TeamSettings() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const router = useRouter();
  const token = session?.user?.accessToken;
  const isOwner = session?.user?.role === "owner";

  const [users, setUsers] = useState<User[]>([]);
  const [invites, setInvites] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const [membersRes, invitesRes] = await Promise.all([
        usersApi.list(token),
        invitationsApi.list(token).catch(() => null),
      ]);
      setUsers(extractRows<User>(membersRes.data, "users"));
      setInvites(invitesRes?.data?.rows ?? []);
    } catch {
      toast.error("Failed to load team");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const invite = async () => {
    if (!token || !email.trim()) return;
    setSending(true);
    try {
      const res = await invitationsApi.create(email.trim(), token);
      setEmail("");
      if (res.data?.emailSent) {
        toast.success(`Invitation sent to ${res.data.email}`);
      } else {
        toast.success("Invitation created", {
          description:
            "No email provider is configured yet, so the invite link was logged on the server instead of emailed.",
        });
      }
      load();
    } catch (e) {
      // 402 = the plan's seat limit is reached.
      if (e instanceof ApiError && e.status === 402) {
        toast("You've reached your plan's team limit", {
          description: e.message,
          action: {
            label: "Upgrade",
            onClick: () => router.push("/dashboard/settings?tab=billing"),
          },
        });
      } else {
        toast.error(e instanceof ApiError ? e.message : "Failed to send invitation");
      }
    } finally {
      setSending(false);
    }
  };

  const revoke = async (inv: Invitation) => {
    if (!token) return;
    try {
      await invitationsApi.revoke(inv.id, token);
      setInvites((prev) => prev.filter((i) => i.id !== inv.id));
      toast.success(t("toast.invitationRevoked"));
    } catch {
      toast.error("Failed to revoke invitation");
    }
  };

  const initials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

  return (
    <div className="space-y-6">
      {/* Invite */}
      {isOwner && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-[#1c0a0c]">{t("team.inviteTeammate")}</h3>
          <p className="text-sm text-[#1c0a0c]/60">
            They&apos;ll get an email with a secure link to join this workspace as a
            member. The link expires in 7 days and can only be used once.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              invite();
            }}
            className="mt-4 flex gap-2"
          >
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1c0a0c]/35" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teammate@company.com"
                className="pl-9"
              />
            </div>
            <Button
              type="submit"
              disabled={sending || !email.trim()}
              className="bg-[#c74959] text-white hover:bg-[#b03f4d]"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send invite
                </>
              )}
            </Button>
          </form>

          {invites.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[#1c0a0c]/50">
                Pending invitations
              </p>
              <div className="space-y-2">
                {invites.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-[#e399a3]/20 bg-[#fdf8f9] px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[#1c0a0c]">
                        {inv.email}
                      </p>
                      <p className="text-xs text-[#1c0a0c]/50">
                        {inv.is_expired ? (
                          <span className="text-red-600">{t("team.expired")}</span>
                        ) : (
                          <>
                            Expires <LocalTime date={inv.expires_at} relative />
                          </>
                        )}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0 text-[#1c0a0c]/60 hover:text-red-600"
                      onClick={() => revoke(inv)}
                    >
                      <X className="h-4 w-4" />
                      Revoke
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Members */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-[#1c0a0c]">{t("team.teamMembers")}</h3>
        <p className="text-sm text-[#1c0a0c]/60">
          Everyone in this workspace. A workspace has one owner; everybody else is
          a member.
        </p>

        <div className="mt-6">
          {loading ? (
            <div className="py-8 text-center text-[#1c0a0c]/60">
              Loading members...
            </div>
          ) : users.length === 0 ? (
            <div className="py-8 text-center text-[#1c0a0c]/60">
              No team members found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("role.member")}</TableHead>
                  <TableHead>{t("auth.email")}</TableHead>
                  <TableHead className="w-[120px]">Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.user_id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-[#c74959] text-xs text-white">
                            {initials(user.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-[#1c0a0c]">
                          {user.full_name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-[#1c0a0c]/70">{user.email}</TableCell>
                    <TableCell>
                      {user.role === "owner" ? (
                        <Badge className="bg-[#c74959] text-white">{t("role.owner")}</Badge>
                      ) : (
                        <Badge variant="outline">{t("role.member")}</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </Card>
    </div>
  );
}

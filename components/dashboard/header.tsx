"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, LogOut, User } from "@/components/icons";
import { useSession } from "next-auth/react";
import { notificationsApi } from "@/lib/api";
import { useRefetchOnFocus } from "@/lib/hooks/use-refetch-on-focus";
import { onNotificationsChanged } from "@/lib/notifications-events";
import { endSession } from "@/lib/auth/end-session";
import { resolveAvatarUrl } from "@/lib/avatar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/i18n/language-selector";
import { MobileSidebar } from "@/components/dashboard/sidebar";
import { useTranslation } from "@/lib/i18n/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function Header({ user }: HeaderProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { t } = useTranslation();
  const token = session?.user?.accessToken;
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnread = useCallback(() => {
    if (!token) return;
    notificationsApi
      .getUnreadCount(token)
      .then((res) => setUnreadCount(res.data?.unreadCount ?? 0))
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    fetchUnread();
    // Poll so the badge stays current even while the tab stays open.
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [fetchUnread]);

  // Update promptly when the user returns to the tab (e.g. after generating
  // activity, or after reading notifications on the notifications page).
  useRefetchOnFocus(fetchUnread);

  // Update the badge instantly when notifications change in-app (mark read,
  // mark all read, delete) without waiting for the poll.
  useEffect(() => onNotificationsChanged(fetchUnread), [fetchUnread]);

  // Prefer the live session (updated after a profile edit) over the server prop.
  const displayName = session?.user?.name ?? user.name;
  const displayImage = resolveAvatarUrl(session?.user?.image ?? user.image);
  const displayEmail = session?.user?.email ?? user.email;

  const initials =
    displayName
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "U";

  // `left-0` on phones (no rail there), `left-64` once the rail appears.
  return (
    <header className="fixed left-0 right-0 top-0 z-30 h-16 border-b border-[#e399a3]/20 bg-white/80 backdrop-blur-md md:left-64">
      <div className="flex h-full items-center justify-between gap-2 px-4 md:px-6">
        {/* min-w-0 lets the greeting truncate instead of shoving the actions
            off-screen on a narrow viewport. */}
        <div className="flex min-w-0 items-center gap-1">
          <MobileSidebar />
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold text-[#1c0a0c] md:text-lg">
              {t("dashboard.welcomeBack")}
            </h1>
            <p className="truncate text-xs text-[#1c0a0c]/60 md:text-sm">
              {displayName || "User"}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-3">
          <LanguageSelector />
          {/* Notifications */}
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="relative text-[#1c0a0c]/70 hover:text-[#c74959]"
          >
            <Link href="/dashboard/notifications" aria-label="Notifications">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="pointer-events-none absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#c74959] px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={displayImage || undefined}
                    alt={displayName || "User"}
                  />
                  <AvatarFallback className="bg-[#c74959] text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{displayName}</p>
                  <p className="text-xs text-[#1c0a0c]/60">{displayEmail}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
                <User className="mr-2 h-4 w-4" />
                {t("user.profile")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-[#c74959]"
                onClick={() =>
                  endSession(session?.user?.accessToken, {
                    callbackUrl: "/login",
                  })
                }
              >
                <LogOut className="mr-2 h-4 w-4" />
                {t("user.signOut")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

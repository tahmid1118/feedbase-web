"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Building2,
  Users,
  ShieldCheck,
  Ticket,
  Tag,
  Headset,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/client";
import { Logo } from "@/components/ui/logo";
import { adminApi } from "@/lib/api";

const navigation = [
  { key: "admin.nav.overview", href: "/admin", icon: LayoutDashboard, exact: true },
  { key: "admin.nav.workspaces", href: "/admin/workspaces", icon: Building2 },
  { key: "admin.nav.support", href: "/admin/support", icon: Headset },
  { key: "admin.nav.users", href: "/admin/users", icon: Users },
  { key: "admin.nav.admins", href: "/admin/admins", icon: ShieldCheck },
  { key: "admin.nav.promoCodes", href: "/admin/promo-codes", icon: Ticket },
  { key: "admin.nav.offers", href: "/admin/offers", icon: Tag },
];

const POLL_MS = 20000;

export function AdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { t } = useTranslation();
  const token = session?.user?.accessToken;
  const [supportUnread, setSupportUnread] = useState(0);

  // Poll the support inbox so the sidebar shows waiting conversations.
  useEffect(() => {
    if (!token) return;
    let active = true;
    const tick = async () => {
      const res = await adminApi.supportInboxUnread(token);
      if (active && res.ok) setSupportUnread(res.data?.sessionsWithUnread ?? 0);
    };
    tick();
    const t = setInterval(tick, POLL_MS);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, [token, pathname]);

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-[#e399a3]/20 bg-white">
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center gap-2 border-b border-[#e399a3]/20 px-6">
          <Logo className="h-8 w-8" />
          <div className="flex flex-col leading-tight">
            <span className="text-lg font-bold text-[#1c0a0c]">FeedBoard</span>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[#c74959]">
              Admin
            </span>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {navigation.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            const badge = item.href === "/admin/support" ? supportUnread : 0;
            return (
              <Link
                key={item.key}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-[#c74959] text-white"
                    : "text-[#1c0a0c]/70 hover:bg-[#fdf8f9] hover:text-[#c74959]"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="flex-1">{t(item.key)}</span>
                {badge > 0 && (
                  <span
                    className={cn(
                      "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold",
                      isActive ? "bg-white text-[#c74959]" : "bg-[#c74959] text-white"
                    )}
                  >
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

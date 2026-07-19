"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  MessageSquare,
  GitBranch,
  FileText,
  Bell,
  Settings,
  ExternalLink,
  MessageSquarePlus,
} from "lucide-react";
import { tenantsApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/client";
import { officialBoardUrl } from "@/lib/official-board";
import { Logo } from "@/components/ui/logo";
import { WorkspaceSwitcher } from "@/components/dashboard/workspace-switcher";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000";

const navigation = [
  { key: "nav.dashboard", href: "/dashboard", icon: LayoutDashboard },
  { key: "nav.feedback", href: "/dashboard/feedback", icon: MessageSquare },
  { key: "nav.roadmap", href: "/dashboard/roadmap", icon: GitBranch },
  { key: "nav.changelog", href: "/dashboard/changelog", icon: FileText },
  { key: "nav.notifications", href: "/dashboard/notifications", icon: Bell },
  { key: "nav.settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { t } = useTranslation();
  const token = session?.user?.accessToken;

  // Resolve this tenant's public portal URL from its subdomain.
  const [portalUrl, setPortalUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let active = true;
    tenantsApi
      .getMine(token)
      .then((res) => {
        const sub = res.data?.subdomain;
        // Protocol-relative so it works in dev (http) and prod (https) alike.
        if (active && sub) setPortalUrl(`//${sub}.${ROOT_DOMAIN}`);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [token]);

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-[#e399a3]/20 bg-white">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-b border-[#e399a3]/20 px-6">
          <Logo className="h-8 w-8" />
          <span className="text-xl font-bold text-[#1c0a0c]">Feedbase</span>
        </div>

        {/* Workspace switcher */}
        <div className="border-b border-[#e399a3]/20 p-3">
          <WorkspaceSwitcher />
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {navigation.map((item) => {
            const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
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
                {t(item.key)}
              </Link>
            );
          })}

          {/* Public portal — external link to this tenant's board */}
          {portalUrl && (
            <a
              href={portalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[#1c0a0c]/70 transition-colors hover:bg-[#fdf8f9] hover:text-[#c74959]"
            >
              <ExternalLink className="h-5 w-5" />
              {t("nav.publicBoard")}
            </a>
          )}

          {/* Feedbase's OWN board — feedback about this app, not the tenant's. */}
          <a
            href={officialBoardUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[#1c0a0c]/70 transition-colors hover:bg-[#fdf8f9] hover:text-[#c74959]"
          >
            <MessageSquarePlus className="h-5 w-5" />
            {t("nav.giveFeedback")}
          </a>
        </nav>
      </div>
    </aside>
  );
}

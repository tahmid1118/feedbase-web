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
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { tenantsApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/client";
import { portalUrlForSubdomain } from "@/lib/official-board";
import { Logo } from "@/components/ui/logo";
import { WorkspaceSwitcher } from "@/components/dashboard/workspace-switcher";


const navigation = [
  { key: "nav.dashboard", href: "/dashboard", icon: LayoutDashboard },
  { key: "nav.feedback", href: "/dashboard/feedback", icon: MessageSquare },
  { key: "nav.roadmap", href: "/dashboard/roadmap", icon: GitBranch },
  { key: "nav.changelog", href: "/dashboard/changelog", icon: FileText },
  { key: "nav.notifications", href: "/dashboard/notifications", icon: Bell },
  { key: "nav.settings", href: "/dashboard/settings", icon: Settings },
];

/**
 * The sidebar's contents, shared by the fixed desktop rail and the mobile
 * drawer, so the navigation exists in exactly one place.
 *
 * `onNavigate` lets the drawer close itself when a link is tapped — without it a
 * mobile user taps a link, the route changes behind the overlay, and the drawer
 * stays open over the page they asked for.
 */
function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
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
        // Host-aware: same-origin /portal/<sub> in dev (so the login carries to
        // the portal), the branded subdomain in production.
        if (active && sub) setPortalUrl(portalUrlForSubdomain(sub));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [token]);

  return (
    <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-b border-[#e399a3]/20 px-6">
          <Logo className="h-8 w-8" />
          <span className="font-display text-xl font-semibold text-[#1c0a0c]">FeedBoard</span>
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
                onClick={onNavigate}
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
              onClick={onNavigate}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[#1c0a0c]/70 transition-colors hover:bg-[#fdf8f9] hover:text-[#c74959]"
            >
              <ExternalLink className="h-5 w-5" />
              {t("nav.publicBoard")}
            </a>
          )}

      </nav>
    </div>
  );
}

/**
 * Fixed rail, tablet and up only. Below `md` the shell has no left margin and
 * navigation moves into `MobileSidebar` — the rail used to be `fixed w-64` with
 * no breakpoint, so on a phone it covered the page while `main`'s hardcoded
 * `ml-64` pushed the content off-screen to the right.
 */
export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r border-[#e399a3]/20 bg-white md:block">
      <SidebarContent />
    </aside>
  );
}

/**
 * The same navigation as a drawer, plus the button that opens it. Rendered by
 * the header so the open/closed state stays local to the trigger.
 */
export function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="-ml-2 text-[#1c0a0c]/70 md:hidden"
          aria-label={t("nav.openMenu")}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[17rem] max-w-[85vw] gap-0 bg-white p-0"
      >
        {/* Radix requires a title for accessibility; the drawer shows the
            branded logo row instead, so keep it visually hidden. */}
        <SheetHeader className="sr-only">
          <SheetTitle>{t("nav.menu")}</SheetTitle>
        </SheetHeader>
        <SidebarContent onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  ShieldCheck,
  Ticket,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";

const navigation = [
  { name: "Overview", href: "/admin", icon: LayoutDashboard, exact: true },
  { name: "Workspaces", href: "/admin/workspaces", icon: Building2 },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Admins", href: "/admin/admins", icon: ShieldCheck },
  { name: "Promo Codes", href: "/admin/promo-codes", icon: Ticket },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-[#e399a3]/20 bg-white">
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center gap-2 border-b border-[#e399a3]/20 px-6">
          <Logo className="h-8 w-8" />
          <div className="flex flex-col leading-tight">
            <span className="text-lg font-bold text-[#1c0a0c]">Feedbase</span>
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
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-[#c74959] text-white"
                    : "text-[#1c0a0c]/70 hover:bg-[#fdf8f9] hover:text-[#c74959]"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

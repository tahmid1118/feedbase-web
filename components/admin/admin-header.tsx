"use client";

import { LogOut, ShieldCheck } from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AdminHeader({
  name,
  email,
}: {
  name?: string | null;
  email?: string | null;
}) {
  return (
    <header className="fixed left-64 right-0 top-0 z-30 h-16 border-b border-[#e399a3]/20 bg-white/80 backdrop-blur-md">
      <div className="flex h-full items-center justify-between px-6">
        <div>
          <h1 className="text-lg font-semibold text-[#1c0a0c]">Admin Panel</h1>
          <p className="text-sm text-[#1c0a0c]/60">Platform administration</p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#c74959] text-white">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <span className="hidden text-sm font-medium text-[#1c0a0c] sm:inline">
                {name || "Admin"}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{name}</p>
                <p className="text-xs text-[#1c0a0c]/60">{email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-[#c74959]"
              onClick={() => signOut({ callbackUrl: "/admin-login" })}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  User,
  Users,
  Tag,
  Plug,
  KeyRound,
  ScrollText,
  Palette,
  CreditCard,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@/lib/api";
import { cn } from "@/lib/utils";
import { ProfileSettings } from "@/components/settings/profile-settings";
import { TeamSettings } from "@/components/settings/team-settings";
import { TagsSettings } from "@/components/settings/tags-settings";
import { IntegrationsSettings } from "@/components/settings/integrations-settings";
import { ApiKeysSettings } from "@/components/settings/api-keys-settings";
import { AuditLogsSettings } from "@/components/settings/audit-logs-settings";
import { BrandingSettings } from "@/components/settings/branding-settings";
import { BillingSettings } from "@/components/settings/billing-settings";

type TabId =
  | "profile"
  | "team"
  | "tags"
  | "integrations"
  | "api-keys"
  | "audit"
  | "branding"
  | "billing";

interface TabDef {
  id: TabId;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

const TABS: TabDef[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "team", label: "Team", icon: Users, adminOnly: true },
  { id: "tags", label: "Tags", icon: Tag, adminOnly: true },
  { id: "integrations", label: "Integrations", icon: Plug, adminOnly: true },
  { id: "api-keys", label: "API Keys", icon: KeyRound, adminOnly: true },
  { id: "audit", label: "Audit Logs", icon: ScrollText, adminOnly: true },
  { id: "branding", label: "Branding", icon: Palette, adminOnly: true },
  { id: "billing", label: "Billing", icon: CreditCard, adminOnly: true },
];

// The workspace owner manages the workspace; members ("user") see Profile only.
const ADMIN_ROLES: UserRole[] = ["owner"];

export default function SettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Role comes straight from the session (set at login).
  const role = (session?.user?.role as UserRole | null) ?? null;
  const isAdmin = role != null && ADMIN_ROLES.includes(role);

  const visibleTabs = useMemo(
    () => TABS.filter((tab) => !tab.adminOnly || isAdmin),
    [isAdmin]
  );

  // The URL's `?tab=` is the single source of truth for the active tab. Deriving
  // it from `searchParams` (rather than seeding local state once at mount) means
  // a same-page navigation switches tabs too — e.g. the Team tab's "Upgrade"
  // action pushing `?tab=billing` while Settings is already open. Falls back to
  // Profile when the tab is missing or not visible for this role.
  const requested = searchParams.get("tab");
  const active =
    requested && visibleTabs.some((t) => t.id === requested)
      ? (requested as TabId)
      : "profile";

  const selectTab = (id: TabId) => {
    router.push(`/dashboard/settings?tab=${id}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#1c0a0c]">Settings</h2>
        <p className="text-sm text-[#1c0a0c]/60">
          Manage your profile and workspace preferences
        </p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <nav className="flex gap-1 overflow-x-auto lg:w-56 lg:flex-col lg:overflow-visible">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => selectTab(tab.id)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active === tab.id
                  ? "bg-[#c74959] text-white"
                  : "text-[#1c0a0c]/70 hover:bg-[#fdf8f9] hover:text-[#c74959]"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="flex-1">
          {active === "profile" && <ProfileSettings />}
          {active === "team" && <TeamSettings />}
          {active === "tags" && <TagsSettings />}
          {active === "integrations" && <IntegrationsSettings />}
          {active === "api-keys" && <ApiKeysSettings />}
          {active === "audit" && <AuditLogsSettings />}
          {active === "branding" && <BrandingSettings />}
          {active === "billing" && <BillingSettings />}
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/lib/i18n/client";

/**
 * Public portal navigation (Board / Changelog). Uses absolute `/portal/<tenant>`
 * hrefs — the proxy passes any `/portal/…` path straight through, so they work
 * both on a subdomain and via the direct path. The active tab is derived from
 * the pathname's suffix so it's correct regardless of that prefix.
 */
export function PortalNav({ tenant, brand }: { tenant: string; brand: string }) {
  const { t } = useTranslation();
  const pathname = usePathname() ?? "";
  const onChangelog = pathname.includes("/changelog");

  // `short` is what renders below `sm`, where this nav shares the header row
  // with the brand and the language control. English "Changelog" is already
  // short, but several translations are not — fr "Journal des modifications"
  // (26 chars) alone would eat the row and leave the tenant's own name
  // truncated to a letter or two on a phone.
  const items = [
    {
      label: t("portal.board"),
      short: t("portal.board"),
      href: `/portal/${tenant}`,
      active: !onChangelog,
    },
    {
      label: t("nav.changelog"),
      short: t("portal.changelogShort"),
      href: `/portal/${tenant}/changelog`,
      active: onChangelog,
    },
  ];

  return (
    <nav className="flex items-center gap-0.5 sm:gap-1">
      {items.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          // Compact below `sm` so this sits in the header row beside the brand
          // and the language control on a ~390px viewport instead of forcing a
          // second row. whitespace-nowrap because "Changelog" translates to
          // longer words (nl "Wijzigingslogboek") that would otherwise wrap
          // inside the pill and make the header two lines tall.
          className="rounded-lg px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors sm:px-3 sm:py-1.5 sm:text-sm"
          style={
            item.active
              ? { backgroundColor: brand, color: "#fff" }
              : { color: "#1c0a0c" }
          }
        >
          <span className="sm:hidden">{item.short}</span>
          <span className="hidden sm:inline">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}

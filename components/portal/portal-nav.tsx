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

  const items = [
    { label: t("portal.board"), href: `/portal/${tenant}`, active: !onChangelog },
    { label: t("nav.changelog"), href: `/portal/${tenant}/changelog`, active: onChangelog },
  ];

  return (
    <nav className="flex items-center gap-1">
      {items.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
          style={
            item.active
              ? { backgroundColor: brand, color: "#fff" }
              : { color: "#1c0a0c" }
          }
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

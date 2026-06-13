"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface PortalNavProps {
  brand: string;
  tenant: string;
}

export function PortalNav({ brand, tenant }: PortalNavProps) {
  const pathname = usePathname();

  // When accessed via /portal/[tenant]/ directly, links must include the prefix.
  // When accessed via subdomain (acme.localhost), the pathname is the bare path
  // and the server-side proxy handles the rewrite, so no prefix is needed.
  const isDirectPath = pathname.startsWith("/portal/");
  const base = isDirectPath ? `/portal/${tenant}` : "";

  const items = [
    { href: `${base}/`, label: "Board", key: "board" },
    { href: `${base}/roadmap`, label: "Roadmap", key: "roadmap" },
    { href: `${base}/changelog`, label: "Changelog", key: "changelog" },
  ];

  const activeKey = pathname.includes("/roadmap")
    ? "roadmap"
    : pathname.includes("/changelog")
      ? "changelog"
      : "board";

  return (
    <nav className="flex items-center gap-1">
      {items.map((item) => {
        const active = item.key === activeKey;
        return (
          <Link
            key={item.key}
            href={item.href}
            className="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
            style={
              active
                ? { backgroundColor: brand, color: "#fff" }
                : { color: "#1c0a0c" }
            }
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

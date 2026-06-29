"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface PortalNavProps {
  brand: string;
  tenant: string;
}

export function PortalNav({ brand, tenant }: PortalNavProps) {
  const pathname = usePathname();
  const [hovered, setHovered] = useState<string | null>(null);

  // When accessed via /portal/[tenant]/ directly, links must include the prefix.
  // When accessed via subdomain (acme.localhost), the pathname is the bare path
  // and the server-side proxy handles the rewrite, so no prefix is needed.
  const isDirectPath = pathname.startsWith("/portal/");
  const base = isDirectPath ? `/portal/${tenant}` : "";

  // Roadmap and changelog are intentionally hidden from the public portal.
  const items = [{ href: `${base}/`, label: "Board", key: "board" }];

  const activeKey = "board";

  return (
    <nav className="flex items-center gap-1">
      {items.map((item) => {
        const active = item.key === activeKey;
        const isHovered = !active && hovered === item.key;
        return (
          <Link
            key={item.key}
            href={item.href}
            onMouseEnter={() => setHovered(item.key)}
            onMouseLeave={() => setHovered(null)}
            className="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
            style={
              active
                ? { backgroundColor: brand, color: "#fff" }
                : isHovered
                  ? { backgroundColor: `${brand}1a`, color: brand }
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

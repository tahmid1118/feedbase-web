import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/app-url";

/**
 * robots.txt for the marketing/auth surface (the bare root domain — see
 * app/sitemap.ts and CLAUDE.md's SEO section for why tenant portal subdomains
 * are a separate concern, not covered here).
 *
 * Disallowed: authenticated app surfaces (nothing to index, and crawling them
 * wastes crawl budget on pages that 302 to /login anyway), the admin panel,
 * onboarding/checkout (mid-flow, not a landing target), and tokened links
 * (password reset, invitations) — a crawler following one would either hit a
 * dead/expired token or, worse, get indexed with a live one in the URL.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard",
        "/admin",
        "/admin-login",
        "/onboarding",
        "/checkout",
        "/api/",
        "/reset-password",
        "/forgot-password",
        "/invite",
      ],
    },
    sitemap: appUrl("/sitemap.xml"),
  };
}

import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/app-url";
import { legalPages, legalHref } from "@/lib/legal";

/**
 * Sitemap for the marketing/auth surface only (app.<root>, i.e. the bare root
 * domain). Public tenant boards live on their own subdomains and are a
 * separate concern — see CLAUDE.md's SEO section for why this is scoped this
 * way. Authenticated routes (dashboard, admin, onboarding, checkout) are
 * excluded; app/robots.ts disallows crawling them too.
 *
 * Add a new static marketing page's route here in the same change that adds
 * the page (CLAUDE.md convention — keep the docs/sitemap in sync with what
 * ships).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: appUrl("/"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: appUrl("/pricing"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: appUrl("/signup"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: appUrl("/login"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    // The four legal documents (Terms, Privacy, Cookies, Refunds).
    ...legalPages.map((page) => ({
      url: appUrl(legalHref(page.slug)),
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];
}

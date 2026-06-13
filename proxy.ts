import { NextRequest, NextResponse } from "next/server";

/**
 * Subdomain / custom-domain routing for the multi-tenant public portal.
 *
 * (Next 16 renamed the `middleware` file convention to `proxy`.)
 *
 * - `app.com`, `www.app.com`            → admin app (pass through)
 * - `acme.app.com/<path>`               → rewrite to `/portal/acme/<path>`
 * - `feedback.acme.com/<path>` (custom) → rewrite to `/portal/feedback.acme.com/<path>`
 *
 * The root domain is configured via `NEXT_PUBLIC_ROOT_DOMAIN` (default
 * `localhost:3000`). For local testing, `*.localhost` subdomains resolve to
 * 127.0.0.1 automatically, or visit `/portal/<tenant>` directly.
 */

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000";

// Subdomains that belong to the admin app, not a tenant portal.
const RESERVED_SUBDOMAINS = new Set([
  "www",
  "app",
  "admin",
  "dashboard",
  "api",
]);

function getHostname(request: NextRequest): string {
  const host =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    "";
  return host.toLowerCase().split(":")[0];
}

/**
 * Resolve the tenant identifier (subdomain label or full custom domain) from
 * the request host, or `null` when the request targets the admin app.
 */
function resolveTenant(host: string): string | null {
  const rootHost = ROOT_DOMAIN.split(":")[0];

  // Bare root domain or www → admin app.
  if (host === rootHost || host === `www.${rootHost}`) return null;

  if (host.endsWith(`.${rootHost}`)) {
    const label = host.slice(0, -(rootHost.length + 1));
    // Only the first label matters (acme.app.com → "acme").
    const subdomain = label.split(".")[0];
    if (!subdomain || RESERVED_SUBDOMAINS.has(subdomain)) return null;
    return subdomain;
  }

  // Host that doesn't match the root domain at all is a custom domain.
  // (Ignore localhost/IP hosts so plain local dev keeps hitting the admin app.)
  if (host === "localhost" || host === "127.0.0.1") return null;

  return host;
}

export function proxy(request: NextRequest) {
  const host = getHostname(request);
  const tenant = resolveTenant(host);

  if (!tenant) return NextResponse.next();

  const url = request.nextUrl.clone();

  // Avoid double-prefixing if something already points at the portal.
  if (url.pathname.startsWith("/portal/")) return NextResponse.next();

  const suffix = url.pathname === "/" ? "" : url.pathname;
  url.pathname = `/portal/${tenant}${suffix}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Run on everything except Next internals, API routes, and static files.
  matcher: ["/((?!_next/|api/|favicon.ico|.*\\..*).*)"],
};

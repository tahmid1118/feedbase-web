/**
 * Absolute URL to a page on the MAIN app (root domain).
 *
 * Needed from the public portal, which runs on a tenant subdomain
 * (`<tenant>.<root>`): a relative `/signup` there is rewritten by the proxy to
 * `/portal/<tenant>/signup` and 404s. An absolute URL to the bare root domain
 * bypasses that and reaches the real marketing/auth pages from anywhere.
 */
const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000";

export function appUrl(path = "/"): string {
  const host = ROOT_DOMAIN.split(":")[0];
  // localhost or a bare IP → http; a real dotted domain → https.
  const isLocal = !host.includes(".") || /^\d+\.\d+\.\d+\.\d+$/.test(host);
  const proto = isLocal ? "http" : "https";
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${proto}://${ROOT_DOMAIN}${p}`;
}

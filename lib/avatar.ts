/**
 * Resolve a stored avatar value into a loadable URL.
 *
 * Uploaded avatars are stored as backend-relative paths (e.g.
 * "uploads/profile-images/image-123.jpeg"); those must be served from the API
 * origin, not the frontend. Absolute URLs (seed/CDN/OAuth) are returned as-is.
 */
const API_BASE_URL =
  process.env.NEXT_PUBLIC_FEEDBASE_API_BASE_URL ||
  process.env.FEEDBASE_API_BASE_URL ||
  "http://localhost:4560";

export function resolveAvatarUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL}/${path.replace(/^\/+/, "")}`;
}

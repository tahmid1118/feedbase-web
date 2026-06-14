/**
 * Anonymous guest identity for the public portal.
 *
 * `fb_guest_id` is a persistent cookie that identifies a browser so the backend
 * can limit voting to one per post per browser (spam control). The voted-post
 * set in localStorage is only a UI hint for the filled/unfilled state — the
 * server is the source of truth and reconciles it on every toggle.
 */
const GUEST_COOKIE = "fb_guest_id";
const ONE_YEAR = 60 * 60 * 24 * 365;

export function getGuestId(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|;\s*)fb_guest_id=([^;]+)/);
  if (match) return decodeURIComponent(match[1]);

  const id =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
  document.cookie = `${GUEST_COOKIE}=${id}; path=/; max-age=${ONE_YEAR}; SameSite=Lax`;
  return id;
}

const votedKey = (tenant: string) => `fb_voted_${tenant}`;

export function getVotedSet(tenant: string): Record<string, boolean> {
  if (typeof localStorage === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(votedKey(tenant)) || "{}");
  } catch {
    return {};
  }
}

export function setVotedLocal(tenant: string, postId: number, voted: boolean) {
  if (typeof localStorage === "undefined") return;
  const set = getVotedSet(tenant);
  if (voted) set[postId] = true;
  else delete set[postId];
  try {
    localStorage.setItem(votedKey(tenant), JSON.stringify(set));
  } catch {
    /* ignore quota / disabled storage */
  }
}

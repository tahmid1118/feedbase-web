/**
 * Deterministic pseudonymous identity for anonymous guests on the public portal.
 *
 * A guest who doesn't sign in or leave a name would otherwise show as an
 * identical "Anonymous" everywhere, which is flat and makes one guest's comments
 * indistinguishable from another's. Instead we derive a stable friendly name
 * (e.g. "Brave Otter") and an avatar colour from a key — the guest's persistent
 * `fb_guest_id` — so the same guest looks consistent across their comments/posts
 * and distinct from other guests. Purely presentational; no PII involved.
 */

const ADJECTIVES = [
  "Brave", "Calm", "Clever", "Bright", "Swift", "Gentle", "Bold", "Cosmic",
  "Curious", "Happy", "Lucky", "Mellow", "Noble", "Quiet", "Sunny", "Witty",
  "Jolly", "Keen", "Merry", "Plucky",
];

const ANIMALS = [
  "Otter", "Fox", "Panda", "Falcon", "Koala", "Lynx", "Heron", "Badger",
  "Tiger", "Robin", "Whale", "Bison", "Deer", "Hawk", "Seal", "Wolf",
  "Owl", "Crane", "Moose", "Sparrow",
];

// Varied but on-brand-adjacent palette; readable with white initials.
const COLORS = [
  "#c74959", "#d97706", "#059669", "#2563eb", "#7c3aed", "#db2777",
  "#0891b2", "#65a30d", "#e11d48", "#9333ea", "#0d9488", "#ca8a04",
];

/** Stable, well-distributed non-negative hash (djb2). */
function hash(input: string): number {
  let h = 5381;
  const s = input || "guest";
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h;
}

export interface GuestIdentity {
  name: string;
  color: string;
}

/** A stable friendly name + colour for an anonymous guest, keyed off `key`. */
export function guestIdentity(key: string): GuestIdentity {
  const h = hash(key);
  const adjective = ADJECTIVES[h % ADJECTIVES.length];
  const animal = ANIMALS[Math.floor(h / ADJECTIVES.length) % ANIMALS.length];
  const color =
    COLORS[Math.floor(h / (ADJECTIVES.length * ANIMALS.length)) % COLORS.length];
  return { name: `${adjective} ${animal}`, color };
}

/** A stable avatar colour for any identity key (named guests, logged-in users). */
export function colorFor(key: string): string {
  return COLORS[hash(key) % COLORS.length];
}

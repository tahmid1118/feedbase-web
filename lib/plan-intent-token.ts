import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

import type { BillingInterval } from "@/lib/api";
import { PAID_PLANS, type PlanIntent } from "@/lib/plan-intent";

/**
 * The plan a visitor picked, carried across signup → onboarding → checkout as a
 * single encrypted token instead of `?plan=pro&interval=year`.
 *
 * AES-256-GCM, keyed off AUTH_SECRET. GCM is authenticated encryption, so one
 * primitive gives both properties we want: the payload cannot be READ (base64
 * or any other encoding would only have hidden it from a glance) and it cannot
 * be ALTERED — a tampered token fails the auth tag and decrypts to nothing
 * rather than silently changing which plan we take money for. The random IV
 * means the same intent produces a different token every time, so the four
 * links can't be recognised by shape either.
 *
 * Being honest about the limit: there are only four possible intents, so
 * someone who clicks all four buttons learns which token maps to which plan for
 * their own session. Encryption cannot fix a four-value space, and nothing here
 * depends on it doing so — this protects the URL's contents, not the fact that
 * a plan was chosen.
 *
 * Verification failure is never an error: it means "no intent", the same
 * graceful path as arriving at /signup directly. Price is never in the token —
 * it is resolved server-side at checkout, so a stale link can only preselect a
 * plan, never a stale price.
 */

/** Generous: a pricing link may sit in a tab or a bookmark for days. */
const TTL_MS = 7 * 24 * 60 * 60 * 1000;
const IV_BYTES = 12;
const TAG_BYTES = 16;

/**
 * The payload is FIXED WIDTH, and that matters. GCM ciphertext is the same
 * length as its plaintext, so spelling the plan out ("pro" vs "business") would
 * make `business` tokens visibly longer than `pro` ones — the length alone
 * would give away the choice the encryption is there to hide. One character per
 * field plus a zero-padded timestamp keeps every token identical in size.
 */
const PLAN_CODE: Record<string, string> = { pro: "p", business: "b" };
const INTERVAL_CODE: Record<string, string> = { month: "m", year: "y" };
const PLAN_BY_CODE: Record<string, string> = { p: "pro", b: "business" };
const INTERVAL_BY_CODE: Record<string, BillingInterval> = { m: "month", y: "year" };
const EXP_DIGITS = 13;
const BODY_LEN = 2 + EXP_DIGITS;

/**
 * A stable 32-byte key from AUTH_SECRET. The secret is high-entropy and this is
 * not a password, so a hash is the right derivation — no salt to store, and the
 * same key on every server in the fleet.
 */
const key = (): Buffer | null => {
  const s = process.env.AUTH_SECRET;
  return s ? createHash("sha256").update(`plan-intent:${s}`).digest() : null;
};

/**
 * Encrypt an intent into a URL-safe token, or null when there is no secret —
 * the caller then links to a plain `/signup` rather than crashing a public page
 * over a missing env var.
 */
export function signPlanIntent(intent: PlanIntent): string | null {
  const k = key();
  if (!k) return null;

  const plan = PLAN_CODE[intent.plan];
  const interval = INTERVAL_CODE[intent.interval];
  if (!plan || !interval) return null;

  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", k, iv);
  const exp = String(Date.now() + TTL_MS).padStart(EXP_DIGITS, "0");
  const enc = Buffer.concat([
    cipher.update(`${plan}${interval}${exp}`, "utf8"),
    cipher.final(),
  ]);

  return Buffer.concat([iv, cipher.getAuthTag(), enc]).toString("base64url");
}

/** Decrypt a token and return the intent it carries, or null if it is not valid. */
export function verifyPlanIntent(token: string | null | undefined): PlanIntent | null {
  const k = key();
  if (!k || !token) return null;

  let body: string;
  try {
    const raw = Buffer.from(token, "base64url");
    if (raw.length <= IV_BYTES + TAG_BYTES) return null;

    const decipher = createDecipheriv("aes-256-gcm", k, raw.subarray(0, IV_BYTES));
    decipher.setAuthTag(raw.subarray(IV_BYTES, IV_BYTES + TAG_BYTES));
    body = Buffer.concat([
      decipher.update(raw.subarray(IV_BYTES + TAG_BYTES)),
      // Throws if the auth tag doesn't match — i.e. the token was tampered
      // with, encrypted under a different secret, or is simply not one of ours.
      decipher.final(),
    ]).toString("utf8");
  } catch {
    return null;
  }

  if (body.length !== BODY_LEN) return null;

  const plan = PLAN_BY_CODE[body[0]];
  const interval = INTERVAL_BY_CODE[body[1]];
  const exp = Number(body.slice(2));
  if (!plan || !PAID_PLANS.includes(plan)) return null;
  if (!interval) return null;
  if (!exp || exp < Date.now()) return null;

  return { plan: plan as PlanIntent["plan"], interval };
}

/**
 * Re-sign a token that has already been verified. Used at each hop so the link
 * a visitor carries forward is fresh rather than an ageing one from the pricing
 * page — and so a token can never outlive its TTL by being passed along.
 */
export function refreshPlanIntent(token: string | null | undefined): string | null {
  const intent = verifyPlanIntent(token);
  return intent ? signPlanIntent(intent) : null;
}

/**
 * Every intent token the pricing cards can link to. The interval toggle is
 * client-side and signing is not, so all four are minted up front and the card
 * picks one.
 */
export function planIntentTokens(): Record<string, Partial<Record<BillingInterval, string>>> {
  const map: Record<string, Partial<Record<BillingInterval, string>>> = {};
  for (const plan of PAID_PLANS) {
    map[plan] = {};
    for (const interval of ["month", "year"] as const) {
      const token = signPlanIntent({ plan: plan as PlanIntent["plan"], interval });
      if (token) map[plan][interval] = token;
    }
  }
  return map;
}

/**
 * Single source of truth for the legal pages (/legal/*).
 *
 * The policies are written around what the product actually does; the values
 * here are the facts only the operator knows. A blank `entity`, `jurisdiction`
 * or `courts` renders as a visible `[ADD: …]` marker on the page so an
 * unfinished document cannot ship unnoticed.
 *
 * `address` is the exception — blank there is a deliberate choice (see below),
 * not an omission, and renders as "available on request" rather than a marker.
 *
 * These documents are a solid, accurate starting point — not legal advice. Have a
 * lawyer in your jurisdiction review them before launch, particularly the
 * liability, governing-law and consumer-rights sections.
 */

export const legal = {
  /** Product name as used throughout the documents. */
  product: "FeedBoard",

  /**
   * The entity that contracts with customers — the trading name of a sole
   * proprietorship, deliberately not the proprietor's personal name.
   *
   * This is the minimum an identifiable controller can be under GDPR Art. 13:
   * a named operator, a jurisdiction, and a contact route that reaches a human.
   * It works here because **Paddle is the merchant of record** — the purchase
   * contract is with Paddle, who publishes their own trader details at
   * checkout and holds full verified identity for this business. If you ever
   * sell direct (BILLING_PROVIDER=stripe), you become the trader yourself and
   * EU consumer law wants a real geographic address again — revisit this then.
   */
  entity: "FeedBoard",

  /**
   * Publicly displayed postal address. Deliberately EMPTY.
   *
   * This is a sole proprietorship run from a residential address, and putting a
   * home address on a public page is a personal-safety problem rather than a
   * compliance win. Empty is a VALID, intentional state here — not an unfilled
   * placeholder: the pages render "available on request" and route people to
   * `contactEmail`, which is a real obligation, so the address must actually be
   * supplied when someone asks. Set this string the moment a registered
   * business or virtual office address exists, and the pages print it instead.
   */
  address: "",

  /** Country whose law governs the terms. */
  jurisdiction: "Bangladesh",

  /** Venue for proceedings — a city, since courts sit in cities, not countries. */
  courts: "Dhaka, Bangladesh",

  /** General contact. */
  contactEmail: "support@feedboardapp.com",

  /** Privacy/data-protection contact (can be the same mailbox). */
  privacyEmail: "privacy@feedboardapp.com",

  /** Shown as "Last updated" on every page. Bump when you change the text. */
  lastUpdated: "6 August 2026 (rev. 3)",
} as const;

/** The four documents, in the order they appear in the switcher. */
export const legalPages = [
  { slug: "terms", title: "Terms of Service", short: "Terms" },
  { slug: "privacy", title: "Privacy Policy", short: "Privacy" },
  { slug: "cookies", title: "Cookie Policy", short: "Cookies" },
  { slug: "refunds", title: "Refund Policy", short: "Refunds" },
] as const;

export type LegalSlug = (typeof legalPages)[number]["slug"];

export const legalHref = (slug: LegalSlug) => `/legal/${slug}`;

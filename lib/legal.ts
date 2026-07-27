/**
 * Single source of truth for the legal pages (/legal/*).
 *
 * ⚠ FILL THESE IN BEFORE YOU TAKE PAYMENTS. The policies are written around what
 * the product actually does, but the four values marked TODO are facts only you
 * know. Anything left blank renders as a visible `[ADD: …]` marker on the page so
 * it cannot ship unnoticed.
 *
 * These documents are a solid, accurate starting point — not legal advice. Have a
 * lawyer in your jurisdiction review them before launch, particularly the
 * liability, governing-law and consumer-rights sections.
 */

export const legal = {
  /** Product name as used throughout the documents. */
  product: "FeedBoard",

  /** TODO: the registered legal entity that contracts with customers. */
  entity: "",

  /** TODO: registered business address (required for EU/UK consumer sales). */
  address: "",

  /** TODO: country/state whose law governs the terms, e.g. "Bangladesh". */
  jurisdiction: "",

  /** TODO: where consumers may bring proceedings, if different from above. */
  courts: "",

  /** General contact. */
  contactEmail: "support@feedboardapp.com",

  /** Privacy/data-protection contact (can be the same mailbox). */
  privacyEmail: "privacy@feedboardapp.com",

  /** Shown as "Last updated" on every page. Bump when you change the text. */
  lastUpdated: "27 July 2026",
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

/**
 * Locale-aware time formatting. Relative time uses `Intl.RelativeTimeFormat`
 * and absolute date/time uses `Intl.DateTimeFormat`, so both render in the
 * viewer's locale (and the viewer's timezone) when `locale` is omitted.
 */

const DIVISIONS: { amount: number; unit: Intl.RelativeTimeFormatUnit }[] = [
  { amount: 60, unit: "second" },
  { amount: 60, unit: "minute" },
  { amount: 24, unit: "hour" },
  { amount: 7, unit: "day" },
  { amount: 4.34524, unit: "week" },
  { amount: 12, unit: "month" },
  { amount: Number.POSITIVE_INFINITY, unit: "year" },
];

/**
 * e.g. "just now" → "5 minutes ago" → "3 weeks ago" (localized).
 * `justNowLabel` is passed in already translated — this module has no access to
 * the i18n dictionary, and it's the only string here Intl can't produce.
 */
export function formatRelativeTime(
  fromMs: number,
  nowMs: number,
  locale?: string,
  justNowLabel = "just now"
): string {
  let duration = (fromMs - nowMs) / 1000; // seconds; negative = past
  // Anything under a minute reads as "just now" (no seconds-level noise).
  if (Math.abs(duration) < 60) return justNowLabel;

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  for (const division of DIVISIONS) {
    if (Math.abs(duration) < division.amount) {
      return rtf.format(Math.round(duration), division.unit);
    }
    duration /= division.amount;
  }
  return rtf.format(Math.round(duration), "year");
}

/** e.g. "Jun 29, 2026, 4:24 PM" (localized). */
export function formatDateTime(dateMs: number, locale?: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(dateMs);
}

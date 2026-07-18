"use client";

import { useEffect, useState } from "react";
import { formatDateTime, formatRelativeTime } from "@/lib/time";
import { useLanguage } from "@/components/providers/i18n-provider";
import { useTranslation } from "@/lib/i18n/client";

/**
 * Renders a timestamp in the app's active language and the viewer's timezone.
 * `relative` shows a live "time ago" label (refreshing each minute) with the
 * absolute date/time on hover; otherwise it shows the absolute localized
 * date/time.
 *
 * The locale comes from the selected UI language, NOT the browser's — otherwise
 * a German page would render "3 days ago" next to translated content.
 * Client-rendered so it uses the viewer's timezone — `suppressHydrationWarning`
 * covers the harmless server/client "now" difference for relative labels.
 */
export function LocalTime({
  date,
  relative = false,
  className,
}: {
  date?: string | null;
  relative?: boolean;
  className?: string;
}) {
  const [now, setNow] = useState(() => Date.now());
  const lng = useLanguage();
  const { t } = useTranslation();

  useEffect(() => {
    if (!relative) return;
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, [relative]);

  if (!date) return null;
  const ms = new Date(date).getTime();
  if (Number.isNaN(ms)) return null;

  const absolute = formatDateTime(ms, lng);
  const label = relative
    ? formatRelativeTime(ms, now, lng, t("time.justNow"))
    : absolute;

  return (
    <time
      dateTime={new Date(ms).toISOString()}
      title={relative ? absolute : undefined}
      className={className}
      suppressHydrationWarning
    >
      {label}
    </time>
  );
}

"use client";

import { useEffect, useState } from "react";
import { formatDateTime, formatRelativeTime } from "@/lib/time";

/**
 * Renders a timestamp in the viewer's locale/timezone. `relative` shows a live
 * "time ago" label (refreshing each minute) with the absolute date/time on
 * hover; otherwise it shows the absolute localized date/time.
 *
 * Client-rendered on purpose so it uses the viewer's locale — `suppressHydration`
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

  useEffect(() => {
    if (!relative) return;
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, [relative]);

  if (!date) return null;
  const ms = new Date(date).getTime();
  if (Number.isNaN(ms)) return null;

  const absolute = formatDateTime(ms);
  const label = relative ? formatRelativeTime(ms, now) : absolute;

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

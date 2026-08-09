"use client";

import { BadgeCheck } from "@/components/icons";
import { useTranslation } from "@/lib/i18n/client";

/**
 * A "verified admin" tick shown beside a name on the public portal when the
 * author's account is a platform admin (the app's own team). Signals to visitors
 * that the reply is an official response — styled in FeedBoard's own rose.
 */
export function VerifiedBadge({
  size = 15,
  label,
}: {
  size?: number;
  /** Tooltip/aria label; defaults to "Verified admin". */
  label?: string;
}) {
  const { t } = useTranslation();
  const resolved = label ?? t("comments.verifiedAdmin");
  return (
    <span
      title={resolved}
      aria-label={resolved}
      role="img"
      className="inline-flex shrink-0"
    >
      <BadgeCheck
        className="text-[#c74959]"
        style={{ width: size, height: size }}
      />
    </span>
  );
}

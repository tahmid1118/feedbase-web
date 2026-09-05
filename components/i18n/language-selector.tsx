"use client";

import { Globe } from "@/components/icons";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { i18next } from "@/lib/i18n/client";
import { useLanguage } from "@/components/providers/i18n-provider";
import { cookieName, languageOptions } from "@/lib/i18n/settings";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Navbar language selector (cookie-based). Changing it writes the `i18next`
 * cookie, switches the live client i18n language, and refreshes the route so
 * Server Components re-render in the new language. Default is English.
 *
 * `iconColor` tints the globe — the public portal passes the tenant's brand
 * colour so the control doesn't clash with their branding; elsewhere it
 * defaults to the FeedBoard rose.
 */
export function LanguageSelector({
  className,
  iconColor = "#c74959",
  compact = false,
}: {
  className?: string;
  iconColor?: string;
  /**
   * Drops the globe below `sm`, leaving a bare language-code chip. Used by the
   * portal header, where this shares one row with the brand and the nav on a
   * phone; the globe is ~20px of that row and the "EN" already says what the
   * control is. Off elsewhere — a lone code with no icon in the marketing or
   * dashboard navbar reads as a stray abbreviation.
   */
  compact?: boolean;
}) {
  const router = useRouter();
  // Server-resolved language — always agrees with the rendered page content.
  const current = useLanguage();
  const currentLabel =
    languageOptions.find((l) => l.code === current)?.label ?? "English";

  const onChange = (code: string) => {
    Cookies.set(cookieName, code, { path: "/", expires: 365, sameSite: "lax" });
    i18next.changeLanguage(code);
    router.refresh();
  };

  return (
    <Select value={current} onValueChange={onChange}>
      <SelectTrigger
        aria-label="Select language"
        className={`w-auto gap-1 border-[#e399a3]/50 px-2 sm:h-9 sm:gap-1.5 sm:px-2.5 ${
          compact ? "h-8" : "h-9"
        } ${className ?? ""}`}
      >
        <Globe
          className={`h-4 w-4 shrink-0 ${compact ? "hidden sm:block" : ""}`}
          style={{ color: iconColor }}
        />
        {/* Explicit children: Radix resolves the item label only on the client,
            so without this the trigger server-renders blank. */}
        <SelectValue>
          {/* Full native name where there is room; the language CODE on a phone,
              where "Português"/"Nederlands" alone can push a nav past the
              viewport. Deliberately NOT a flag: a flag names a country, not a
              language (whose flag is English?), and flag emoji do not render on
              Windows, so the control would show bare letters there. */}
          <span className="hidden sm:inline">{currentLabel}</span>
          <span className="text-xs font-semibold uppercase sm:hidden">
            {current}
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {languageOptions.map((l) => (
          <SelectItem key={l.code} value={l.code}>
            {l.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

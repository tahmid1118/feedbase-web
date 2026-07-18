"use client";

import { Globe } from "lucide-react";
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
 */
export function LanguageSelector({ className }: { className?: string }) {
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
        className={`h-9 w-auto gap-1.5 border-[#e399a3]/50 px-2.5 ${className ?? ""}`}
      >
        <Globe className="h-4 w-4 text-[#c74959]" />
        {/* Explicit children: Radix resolves the item label only on the client,
            so without this the trigger server-renders blank. */}
        <SelectValue>{currentLabel}</SelectValue>
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

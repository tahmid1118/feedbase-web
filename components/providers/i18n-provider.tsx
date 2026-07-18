"use client";

import { createContext, useContext, useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import { i18next } from "@/lib/i18n/client";
import { fallbackLng } from "@/lib/i18n/settings";

/**
 * The language resolved SERVER-side from the `i18next` cookie. This is the
 * single source of truth: Server Components render with it, so any client
 * component that needs to know the active language (the navbar selector) must
 * read it from here rather than from `i18n.resolvedLanguage` — the latter
 * settles asynchronously as the locale bundle loads and can briefly (or, if no
 * `languageChanged` event follows, permanently) report the fallback instead.
 */
const LanguageContext = createContext<string>(fallbackLng);

/** The active language, as resolved server-side for this request. */
export const useLanguage = () => useContext(LanguageContext);

/**
 * Wraps the app in the client i18next instance. `lng` is the language resolved
 * server-side from the cookie so the first client render matches the server.
 * The navbar `LanguageSelector` changes it live via `i18next.changeLanguage`.
 */
export function I18nProvider({
  lng,
  children,
}: {
  lng: string;
  children: React.ReactNode;
}) {
  // Sync during render too, so client components server-render in `lng`.
  if (i18next.language !== lng) {
    i18next.changeLanguage(lng);
  }

  useEffect(() => {
    if (i18next.language !== lng) {
      i18next.changeLanguage(lng);
    }
    if (typeof document !== "undefined") {
      document.documentElement.lang = lng;
    }
  }, [lng]);

  return (
    <LanguageContext.Provider value={lng}>
      <I18nextProvider i18n={i18next}>{children}</I18nextProvider>
    </LanguageContext.Provider>
  );
}

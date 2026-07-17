"use client";

import { useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import { i18next } from "@/lib/i18n/client";

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
  if (i18next.resolvedLanguage !== lng) {
    i18next.changeLanguage(lng);
  }

  useEffect(() => {
    if (i18next.resolvedLanguage !== lng) {
      i18next.changeLanguage(lng);
    }
    if (typeof document !== "undefined") {
      document.documentElement.lang = lng;
    }
  }, [lng]);

  return <I18nextProvider i18n={i18next}>{children}</I18nextProvider>;
}

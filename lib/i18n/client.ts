"use client";

import i18next from "i18next";
import resourcesToBackend from "i18next-resources-to-backend";
import { initReactI18next, useTranslation as useTranslationOrg } from "react-i18next";

import { getOptions, languages } from "./settings";

const runsOnServerSide = typeof window === "undefined";

// No browser LanguageDetector on purpose. The server resolves the language from
// the `i18next` cookie (lib/i18n/server.ts `getLanguage`) and hands it to
// `I18nProvider`, which is the single source of truth. A client-side detector
// would resolve independently — and, since the server deliberately ignores
// `navigator` (no cookie ⇒ English), it could disagree with the rendered page,
// leaving the navbar selector showing a different language than the content.
i18next
  .use(initReactI18next)
  .use(
    resourcesToBackend(
      (language: string, namespace: string) =>
        import(`./locales/${language}/${namespace}.json`)
    )
  )
  .init({
    ...getOptions(),
    preload: runsOnServerSide ? languages : [],
  });

/** Client `useTranslation` — same signature as react-i18next. */
export function useTranslation(ns?: string, options?: Record<string, unknown>) {
  return useTranslationOrg(ns, options);
}

export { i18next };

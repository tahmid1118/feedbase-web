"use client";

import i18next from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import resourcesToBackend from "i18next-resources-to-backend";
import { initReactI18next, useTranslation as useTranslationOrg } from "react-i18next";

import { cookieName, getOptions, languages } from "./settings";

const runsOnServerSide = typeof window === "undefined";

i18next
  .use(initReactI18next)
  .use(LanguageDetector)
  .use(
    resourcesToBackend(
      (language: string, namespace: string) =>
        import(`./locales/${language}/${namespace}.json`)
    )
  )
  .init({
    ...getOptions(),
    lng: undefined, // detect on the client
    detection: {
      // Cookie wins (set by the navbar selector); then the browser language.
      order: ["cookie", "htmlTag", "navigator"],
      lookupCookie: cookieName,
      caches: ["cookie"],
    },
    preload: runsOnServerSide ? languages : [],
  });

/** Client `useTranslation` — same signature as react-i18next. */
export function useTranslation(ns?: string, options?: Record<string, unknown>) {
  return useTranslationOrg(ns, options);
}

export { i18next };

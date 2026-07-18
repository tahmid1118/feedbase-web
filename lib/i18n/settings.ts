/**
 * i18n configuration (cookie-based, no URL segment). English is the default and
 * the source of truth; every other language falls back to English per-key, so a
 * partial translation never shows a broken key. The active language is stored in
 * the `i18next` cookie and chosen from the navbar language selector.
 */

export const fallbackLng = "en";
export const defaultNS = "common";
export const cookieName = "i18next";

/** The 8 major EU languages, English first. `label` is the native name. */
export const languageOptions = [
  { code: "en", label: "English" },
  { code: "de", label: "Deutsch" },
  { code: "fr", label: "Français" },
  { code: "es", label: "Español" },
  { code: "it", label: "Italiano" },
  { code: "pt", label: "Português" },
  { code: "nl", label: "Nederlands" },
  { code: "pl", label: "Polski" },
] as const;

export const languages: string[] = languageOptions.map((l) => l.code);

export type LanguageCode = (typeof languageOptions)[number]["code"];

export function getOptions(lng: string = fallbackLng, ns: string = defaultNS) {
  return {
    supportedLngs: languages,
    fallbackLng,
    lng,
    fallbackNS: defaultNS,
    defaultNS,
    ns,
    interpolation: { escapeValue: false },
  };
}

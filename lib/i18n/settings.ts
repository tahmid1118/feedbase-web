/**
 * i18n configuration (cookie-based, no URL segment). English is the default and
 * the source of truth; every other language falls back to English per-key, so a
 * partial translation never shows a broken key. The active language is stored in
 * the `i18next` cookie and chosen from the navbar language selector.
 */

export const fallbackLng = "en";
export const defaultNS = "common";
export const cookieName = "i18next";

/** The 24 official EU languages, English first. `label` is the native name. */
export const languageOptions = [
  { code: "en", label: "English" },
  { code: "bg", label: "Български" },
  { code: "hr", label: "Hrvatski" },
  { code: "cs", label: "Čeština" },
  { code: "da", label: "Dansk" },
  { code: "nl", label: "Nederlands" },
  { code: "et", label: "Eesti" },
  { code: "fi", label: "Suomi" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "el", label: "Ελληνικά" },
  { code: "hu", label: "Magyar" },
  { code: "ga", label: "Gaeilge" },
  { code: "it", label: "Italiano" },
  { code: "lv", label: "Latviešu" },
  { code: "lt", label: "Lietuvių" },
  { code: "mt", label: "Malti" },
  { code: "pl", label: "Polski" },
  { code: "pt", label: "Português" },
  { code: "ro", label: "Română" },
  { code: "sk", label: "Slovenčina" },
  { code: "sl", label: "Slovenščina" },
  { code: "es", label: "Español" },
  { code: "sv", label: "Svenska" },
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

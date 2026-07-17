import "server-only";
import { cookies } from "next/headers";
import { createInstance } from "i18next";
import resourcesToBackend from "i18next-resources-to-backend";
import { initReactI18next } from "react-i18next/initReactI18next";

import { cookieName, defaultNS, fallbackLng, getOptions, languages } from "./settings";

/** The active language for the current request, from the `i18next` cookie. */
export async function getLanguage(): Promise<string> {
  const store = await cookies();
  const lng = store.get(cookieName)?.value;
  return lng && languages.includes(lng) ? lng : fallbackLng;
}

/** Server-side translator for Server Components. */
export async function getTranslation(lng?: string, ns: string = defaultNS) {
  const language = lng ?? (await getLanguage());
  const i18n = createInstance();
  await i18n
    .use(initReactI18next)
    .use(
      resourcesToBackend(
        (language: string, namespace: string) =>
          import(`./locales/${language}/${namespace}.json`)
      )
    )
    .init(getOptions(language, ns));
  return {
    t: i18n.getFixedT(language, ns),
    i18n,
    lng: language,
  };
}

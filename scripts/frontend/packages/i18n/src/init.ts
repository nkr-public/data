import i18next from "i18next";
import type { i18n as I18nInstance } from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import {
  DEFAULT_LANGUAGE,
  DEFAULT_NAMESPACE,
  NAMESPACES,
  RTL_LANGUAGES,
  resources,
  SUPPORTED_LANGUAGES,
  type SupportedLanguage
} from "./resources";

export const I18N_STORAGE_KEY = "app.language";

let initialized = false;

/** Détermine si une langue doit être affichée de droite à gauche. */
export function isRtl(language: string): boolean {
  const base = language.split("-")[0];
  return RTL_LANGUAGES.includes(base as SupportedLanguage);
}

/** Applique la direction et la langue sur le document (RTL/LTR + attribut lang). */
export function applyDocumentDirection(language: string) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = language;
  document.documentElement.dir = isRtl(language) ? "rtl" : "ltr";
}

/**
 * Initialise l'instance i18next partagée du monorepo (singleton).
 * Garantit qu'une seule instance est créée quel que soit le nombre d'apps
 * qui l'importent, afin de ne pas dupliquer les traductions ni le state.
 */
export function initI18n(): I18nInstance {
  if (initialized) {
    return i18next;
  }
  initialized = true;

  i18next
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      supportedLngs: SUPPORTED_LANGUAGES,
      fallbackLng: DEFAULT_LANGUAGE,
      defaultNS: DEFAULT_NAMESPACE,
      ns: NAMESPACES,
      interpolation: {
        escapeValue: false
      },
      detection: {
        order: ["localStorage", "navigator", "htmlTag"],
        lookupLocalStorage: I18N_STORAGE_KEY,
        caches: ["localStorage"]
      },
      returnEmptyString: false
    });

  applyDocumentDirection(i18next.language ?? DEFAULT_LANGUAGE);

  i18next.on("languageChanged", (language) => {
    applyDocumentDirection(language);
  });

  return i18next;
}

export function changeLanguage(language: SupportedLanguage) {
  return i18next.changeLanguage(language);
}

export { i18next };

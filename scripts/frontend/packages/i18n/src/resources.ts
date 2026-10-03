import frCommon from "./locales/fr/common.json";
import frApp from "./locales/fr/app.json";
import frValidation from "./locales/fr/validation.json";
import frErrors from "./locales/fr/errors.json";
import frNotifications from "./locales/fr/notifications.json";
import frAccessibility from "./locales/fr/accessibility.json";

import enCommon from "./locales/en/common.json";
import enApp from "./locales/en/app.json";
import enValidation from "./locales/en/validation.json";
import enErrors from "./locales/en/errors.json";
import enNotifications from "./locales/en/notifications.json";
import enAccessibility from "./locales/en/accessibility.json";

import arCommon from "./locales/ar/common.json";
import arApp from "./locales/ar/app.json";
import arValidation from "./locales/ar/validation.json";
import arErrors from "./locales/ar/errors.json";
import arNotifications from "./locales/ar/notifications.json";
import arAccessibility from "./locales/ar/accessibility.json";

/** Namespaces disponibles, un fichier JSON par domaine fonctionnel et par langue. */
export const NAMESPACES = [
  "common",
  "app",
  "validation",
  "errors",
  "notifications",
  "accessibility"
] as const;

export type Namespace = (typeof NAMESPACES)[number];

export const DEFAULT_NAMESPACE: Namespace = "common";

/** Langues supportées, le français est la langue par défaut / de repli. */
export const SUPPORTED_LANGUAGES = ["fr", "en", "ar"] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: SupportedLanguage = "fr";

/** Langues à afficher en RTL (right-to-left). */
export const RTL_LANGUAGES: SupportedLanguage[] = ["ar"];

export const resources = {
  fr: {
    common: frCommon,
    app: frApp,
    validation: frValidation,
    errors: frErrors,
    notifications: frNotifications,
    accessibility: frAccessibility
  },
  en: {
    common: enCommon,
    app: enApp,
    validation: enValidation,
    errors: enErrors,
    notifications: enNotifications,
    accessibility: enAccessibility
  },
  ar: {
    common: arCommon,
    app: arApp,
    validation: arValidation,
    errors: arErrors,
    notifications: arNotifications,
    accessibility: arAccessibility
  }
} as const;

import React from "react";
import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "./resources";
import { changeLanguage } from "./init";

export interface LanguageSwitcherProps {
  className?: string;
}

/**
 * Sélecteur de langue partagé : change la langue instantanément (sans
 * rechargement de page), persiste le choix (via le détecteur i18next) et
 * met à jour la direction du document. Peut être intégré dans n'importe
 * quel header d'application.
 */
export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const { t, i18n } = useTranslation("common");

  return (
    <select
      aria-label={t("language.label")}
      value={i18n.language}
      onChange={(e) => changeLanguage(e.target.value as SupportedLanguage)}
      className={className}
    >
      {SUPPORTED_LANGUAGES.map((lang) => (
        <option key={lang} value={lang}>
          {t(`language.${lang}`)}
        </option>
      ))}
    </select>
  );
}

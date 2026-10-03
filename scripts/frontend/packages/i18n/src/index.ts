export { initI18n, changeLanguage, isRtl, applyDocumentDirection, i18next, I18N_STORAGE_KEY } from "./init";
export {
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  RTL_LANGUAGES,
  NAMESPACES,
  DEFAULT_NAMESPACE,
  type SupportedLanguage,
  type Namespace
} from "./resources";
export { formatDate, formatDateTime, formatNumber, formatCurrency } from "./format";
export { useDirection } from "./useDirection";
export { LanguageSwitcher, type LanguageSwitcherProps } from "./LanguageSwitcher";
export { translateApiError, type ApiErrorLike } from "./translateApiError";

// Re-export du hook standard react-i18next pour éviter toute duplication
// d'instance ou de dépendance dans les apps consommatrices.
export { useTranslation, Trans } from "react-i18next";

import { i18next } from "./init";

/**
 * Forme attendue d'une erreur renvoyée par le backend : un code stable
 * (ex: "ITEM_NOT_FOUND") accompagné éventuellement d'un
 * message technique qui ne doit jamais être affiché à l'utilisateur final.
 */
export interface ApiErrorLike {
  code?: string;
  status?: number;
  message?: string;
}

/**
 * Traduit une erreur backend à partir de son code stable
 * (`errors.codes.<CODE>`), avec repli sur des messages génériques par
 * statut HTTP, puis sur un message générique. Ne renvoie jamais le message
 * technique brut de l'exception.
 */
export function translateApiError(error: ApiErrorLike | null | undefined): string {
  if (!error) {
    return i18next.t("errors:generic");
  }

  if (error.code) {
    const key = `errors:codes.${error.code}`;
    if (i18next.exists(key)) {
      return i18next.t(key);
    }
  }

  switch (error.status) {
    case 401:
      return i18next.t("errors:unauthorized");
    case 403:
      return i18next.t("errors:forbidden");
    case 404:
      return i18next.t("errors:notFound");
    case 409:
      return i18next.t("errors:conflict");
    default:
      return i18next.t("errors:generic");
  }
}

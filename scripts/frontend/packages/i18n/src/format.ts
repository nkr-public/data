import { i18next } from "./init";

/**
 * Formatage des dates, nombres et devises via l'API Intl native, en se basant
 * sur la langue courante d'i18next. Ces helpers ne modifient jamais les
 * valeurs métier, ils ne font que les afficher dans le format attendu par la
 * langue active.
 */

function currentLocale(): string {
  return i18next.language || "fr";
}

export function formatDate(value: Date | number | string, options?: Intl.DateTimeFormatOptions): string {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat(currentLocale(), options).format(date);
}

export function formatDateTime(value: Date | number | string): string {
  return formatDate(value, {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

export function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(currentLocale(), options).format(value);
}

export function formatCurrency(value: number, currency: string, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(currentLocale(), {
    style: "currency",
    currency,
    ...options
  }).format(value);
}

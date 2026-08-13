export type Locale = "fr-FR" | "en-GB";

export const LOCALE_COOKIE_NAME = "NEXT_LOCALE";
export const DEFAULT_LOCALE: Locale = "fr-FR";

const LOCALES: readonly Locale[] = ["fr-FR", "en-GB"];

export function isLocale(value: string | undefined): value is Locale {
  return LOCALES.includes(value as Locale);
}

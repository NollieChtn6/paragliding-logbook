import type { Locale } from "@/lib/i18n/locale-cookie";

// "fr-FR"/"en-GB" sont directement des tags BCP-47 valides pour
// toLocaleDateString, pas besoin d'une table de correspondance.
export function formatDate(date: Date, locale: Locale): string {
  return date.toLocaleDateString(locale);
}

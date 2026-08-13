import type { Locale } from "@/lib/i18n/locale-cookie";
import enGB from "@/messages/en-GB";
import frFR from "@/messages/fr-FR";

export type Messages = typeof frFR;

const dictionaries: Record<Locale, Messages> = {
  "fr-FR": frFR,
  "en-GB": enGB,
};

export function getDictionary(locale: Locale): Messages {
  return dictionaries[locale];
}

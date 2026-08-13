import { cookies } from "next/headers";
import {
  DEFAULT_LOCALE,
  isLocale,
  LOCALE_COOKIE_NAME,
  type Locale,
} from "@/lib/i18n/locale-cookie";

// Lecture côté serveur uniquement (Server Components/Actions) : le cookie
// fait foi, pas de négociation Accept-Language (voir docs/decisions/009).
export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get(LOCALE_COOKIE_NAME)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

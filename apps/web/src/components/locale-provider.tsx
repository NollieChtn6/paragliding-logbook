"use client";

import { useRouter } from "next/navigation";
import type * as React from "react";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { LOCALE_COOKIE_NAME, type Locale } from "@/lib/i18n/locale-cookie";
import { getDictionary, type Messages } from "@/messages";

type LocaleContextValue = {
  locale: Locale;
  messages: Messages;
  setLocale: (locale: Locale) => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

// La locale initiale vient du cookie lu côté serveur (voir lib/i18n/get-locale.ts)
// : pas de flash à gérer ici contrairement à ThemeProvider (le thème système
// n'est connu qu'après montage côté client, la locale est connue dès le
// premier rendu serveur).
export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const router = useRouter();

  const setLocale = useCallback(
    (next: Locale) => {
      document.cookie = `${LOCALE_COOKIE_NAME}=${next};path=/;max-age=31536000;samesite=lax`;
      setLocaleState(next);
      router.refresh();
    },
    [router],
  );

  const value = useMemo(
    () => ({ locale, messages: getDictionary(locale), setLocale }),
    [locale, setLocale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

function useLocaleContext(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale/useT must be used within a LocaleProvider");
  }
  return context;
}

export function useLocale(): [Locale, (locale: Locale) => void] {
  const { locale, setLocale } = useLocaleContext();
  return [locale, setLocale];
}

export function useT(): Messages {
  return useLocaleContext().messages;
}

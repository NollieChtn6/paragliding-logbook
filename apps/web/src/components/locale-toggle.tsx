"use client";

import { Languages } from "lucide-react";
import { useLocale, useT } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";

export function LocaleToggle() {
  const [locale, setLocale] = useLocale();
  const t = useT();

  const isFrench = locale === "fr-FR";
  const label = isFrench ? t.common.switchToEnglish : t.common.switchToFrench;

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label={label}
      title={label}
      onClick={() => setLocale(isFrench ? "en-GB" : "fr-FR")}
    >
      <Languages />
    </Button>
  );
}

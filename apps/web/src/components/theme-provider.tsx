"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type * as React from "react";

// attribute="class" : bascule la classe .dark sur <html>, déjà consommée par
// @custom-variant dark (&:is(.dark *)) dans globals.css. defaultTheme
// "system" : respecte le thème du système tant que l'utilisateur n'a pas
// choisi explicitement via ThemeToggle.
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </NextThemesProvider>
  );
}

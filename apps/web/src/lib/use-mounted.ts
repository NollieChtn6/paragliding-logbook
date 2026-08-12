import { useEffect, useState } from "react";

// Certaines valeurs (window.matchMedia, window.location, localStorage...) ne
// sont connues qu'après le montage côté client — les lire pendant le rendu
// serveur produirait un résultat incohérent avec l'hydratation. Même pattern
// que ThemeToggle (components/theme-toggle.tsx), factorisé ici car réutilisé
// par plusieurs composants PWA (InstallPrompt, InstallQrCode).
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}

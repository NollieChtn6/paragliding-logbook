// Redéclaration manuelle des tokens de DA utilisés par l'app (globals.css)
// : @react-pdf/renderer ne consomme pas les variables CSS Tailwind (ADR
// 013). Sous-ensemble utile au template PDF, pas la palette complète —
// toute évolution de globals.css doit être répercutée ici à la main.
export const PDF_COLORS = {
  primary: "#2563eb",
  primaryForeground: "#f8fafc",
  accent: "#f59e0b",
  accentForeground: "#0f172a",
  foreground: "#0f172a",
  mutedForeground: "#64748b",
  border: "#e2e8f0",
  background: "#f8fafc",
} as const;

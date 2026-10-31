// Redéclaration manuelle des tokens de DA utilisés par l'app (globals.css)
// : @react-pdf/renderer ne consomme pas les variables CSS Tailwind (ADR
// 013). Sous-ensemble utile au template PDF, pas la palette complète —
// toute évolution de globals.css doit être répercutée ici à la main.
//
// Exception assumée : le document imite un carnet papier (ADR 013), donc
// `background`, `foreground`, `mutedForeground`, `border` et `dotted`
// prennent des teintes chaudes/encre propres au PDF, et ne reflètent plus
// les tokens de l'app. `primary` et `accent` restent ceux de l'app.
export const PDF_COLORS = {
  primary: "#2563eb",
  primaryDark: "#1e40af",
  primaryForeground: "#f8fafc",
  accent: "#f59e0b",
  accentForeground: "#0f172a",
  // Papier crème et encre bleu nuit (pas le blanc/ardoise de l'app).
  background: "#fbf7ee",
  foreground: "#1b2a41",
  mutedForeground: "#5b6b82",
  // Filets des tableaux (tirés du papier) et points de conduite.
  border: "#d8cfba",
  dotted: "#8a97ab",
} as const;

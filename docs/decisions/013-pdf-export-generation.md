# ADR 013 - Export PDF du carnet : génération serveur avec `@react-pdf/renderer`

## Contexte

Le carnet de progression doit pouvoir être exporté en PDF (format A5 portrait), en conservant la DA générale de l'application (couleurs `primary`/`accent`, police Plus Jakarta Sans — voir `docs/ui-directions.md`), pour être montré à un moniteur.

Deux approches de génération étaient envisageables :

1. **HTML + CSS d'impression, rendu par un navigateur headless** (ex. Puppeteer côté serveur) : réutilise directement les composants/CSS Tailwind existants, fidélité DA quasi parfaite par construction, mais ajoute une dépendance serveur lourde (navigateur headless à builder/déployer, empreinte mémoire par génération).
2. **Génération programmatique** avec `@react-pdf/renderer` : API de mise en page dédiée (proche de composants React, mais avec son propre moteur de rendu PDF), aucune dépendance navigateur, déploiement simple, mais ne consomme pas directement le CSS Tailwind existant — les styles doivent être redéclarés dans l'API du renderer.

Aucune dépendance PDF n'existait avant cette fonctionnalité (`apps/web/package.json`).

Un point technique supplémentaire s'est posé une fois `@react-pdf/renderer` retenu : sa prise en charge des polices personnalisées (`Font.register`) est documentée comme fiable en TTF/OTF, mais instable en WOFF2 — or la police de l'application (Plus Jakarta Sans) n'est auto-hébergée qu'en WOFF2 variable (`apps/web/src/app/layout.tsx`, `next/font/local`).

## Décision

L'export PDF est généré **côté serveur** (route API Next.js, données résolues depuis la session comme le reste de l'application — jamais de `userId` client), avec **`@react-pdf/renderer`**, plutôt qu'un navigateur headless.

La police Plus Jakarta Sans est embarquée dans le PDF via des fichiers **TTF statiques dédiés** (Regular/Medium/Bold, licence OFL, mêmes glyphes que la version WOFF2 variable déjà utilisée sur le web), ajoutés spécifiquement pour ce rendu — sans remplacer ni dupliquer la police web existante.

Les tokens de couleur (`primary` `#2563EB`, `accent` `#F59E0B`, etc.) sont redéclarés manuellement dans le template PDF, faute de pouvoir consommer les variables CSS Tailwind existantes depuis `@react-pdf/renderer`.

## Conséquences

Avantages :

- aucune dépendance à un navigateur headless en production (pas de binaire Chromium à builder/maintenir, empreinte mémoire prévisible par génération) ;
- mise en page prévisible et testable (composants déclaratifs), cohérente avec le reste du code serveur de l'application ;
- police officielle de la marque réellement embarquée dans le PDF (pas de police de repli), la conversion TTF étant triviale et sans risque de licence (Plus Jakarta Sans est OFL).

Inconvénients :

- les tokens de DA (couleurs, typographie) sont dupliqués à la main entre `globals.css`/`docs/ui-directions.md` et le template PDF — toute évolution de palette doit être répercutée manuellement des deux côtés, sans garde-fou automatique ;
- les composants React/Tailwind existants (cartes, badges d'activité, etc.) ne sont pas réutilisables tels quels dans le PDF : la mise en page doit être reconstruite avec l'API de `@react-pdf/renderer` ;
- si un besoin de fidélité pixel-perfect avec le web apparaît plus tard (ou l'ajout de graphiques complexes), ce choix pourra être révisé en faveur d'un rendu HTML/headless — aucune donnée ni modèle à migrer, uniquement la couche de génération.

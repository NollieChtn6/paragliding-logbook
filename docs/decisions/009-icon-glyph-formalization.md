# ADR 009 - Glyphe dessiné pour les icônes/écran de lancement, emoji conservé dans l'UI

## Contexte

ADR 008 avait retenu l'emoji 🪂 comme glyphe des icônes générées (favicon, PWA, iOS, écran de lancement), pour zéro travail graphique et cohérence immédiate avec l'emoji déjà utilisé dans l'UI (connexion, inscription, `AppShell`/`AdminShell`, `DesktopSidebar`). Assumé comme inconvénient dans ADR 008 : rendu dépendant d'un CDN externe (twemoji, via `next/og`) au moment du build.

Demande explicite de l'utilisatrice, dans le cadre d'une proposition d'amélioration UX globale : formaliser ces icônes avec une marque dessinée plutôt que l'emoji, sans changer l'univers visuel "Ciel et Altitude" ni ses couleurs.

## Décision

Glyphe : silhouette de voile de parapente stylisée (arc large au bord d'attaque, effilé au bord de fuite), un unique `<path>` SVG partagé (`src/lib/icon-glyph.tsx`, composant `ParagliderWingGlyph`), rendu en blanc (`#f8fafc`) sur les fonds de marque existants (Altitude Blue uni pour favicon/PWA/iOS, dégradé Altitude Blue → Thermal Amber pour l'écran de lancement — inchangés).

Portée volontairement limitée aux surfaces d'icônes/écran de lancement générées (`icon.tsx`, `apple-icon.tsx`, `icon-512/route.tsx`, `icon-maskable/route.tsx`, `apple-splash/route.tsx`) : l'emoji 🪂 reste utilisé tel quel dans l'UI applicative (connexion, inscription, `DesktopSidebar`) — remplacer l'emoji partout dans l'interface est un changement plus visible, hors du périmètre de cette demande.

Un seul `<path>` plutôt qu'un tracé multi-détails : un motif chargé se brouille aux petites tailles (favicon 32×32), vérifié en rendant chaque taille (32 à 512px) via le serveur de développement avant de considérer le glyphe validé.

## Conséquences

Avantages :

- plus de dépendance à un CDN emoji externe (twemoji) au moment du build de ces routes ;
- marque plus distinctive et reconnaissable qu'un emoji générique, dès la plus petite taille (favicon) ;
- une seule source (`ParagliderWingGlyph`) pour les 5 surfaces, taille et couleur paramétrées par appel — pas de duplication du tracé.

Inconvénients :

- deux marques coexistent toujours dans l'app, mais leur nature change : ce n'est plus le même emoji rendu deux fois (UI vs icônes système, ADR 008), mais deux glyphes réellement différents (emoji dans l'UI, silhouette dessinée dans les icônes système) — écart plus visible qu'avant si on les compare côte à côte, accepté pour ne pas élargir le périmètre de cette demande à l'UI applicative ;
- pas de couverture de test automatisé pour le rendu binaire des icônes, comme pour ADR 008 — vérification manuelle (fetch direct des routes + inspection visuelle) reste la méthode réelle.

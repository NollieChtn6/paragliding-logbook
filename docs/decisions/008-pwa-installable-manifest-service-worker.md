# ADR 008 - PWA installable : manifest, icônes, service worker à la main, installation via QR code

## Contexte

`docs/todo.md` listait « Mode PWA / application mobile installable, avec fonctionnement offline partiel » dans les idées futures, non implémenté sans demande explicite (règle fondamentale de CLAUDE.md). Demande explicite de l'utilisatrice : rendre THERMIK installable, avec un moyen simple de récupérer l'app sur son téléphone depuis le dashboard authentifié.

État avant cette ADR : aucun manifest, aucune icône au-delà de `favicon.ico`, aucun service worker, aucune dépendance PWA — terrain vierge.

## Décision

### Manifest et icônes via les conventions natives Next.js

`app/manifest.ts` et `app/icon.tsx`/`app/apple-icon.tsx` (App Router) câblent automatiquement les `<link>` correspondants, générés statiquement au build — zéro dépendance, compatible Turbopack nativement (fonctionnalité Next, pas un plugin webpack). Deux routes supplémentaires (`app/icon-512/route.tsx`, `app/icon-maskable/route.tsx`) génèrent les tailles manquantes pour le manifeste plutôt que de committer des PNG binaires : tout reste dérivé d'une seule source (le glyphe et les couleurs de marque).

Glyphe retenu : l'emoji 🪂 déjà utilisé comme marque dans l'UI (connexion, inscription, `AppShell`, `AdminShell`, `DesktopSidebar`) — cohérence visuelle immédiate, aucun travail graphique. Alternative écartée : un pictogramme SVG dédié (plus fiable à générer, plus conforme à la règle déjà écrite dans `docs/ui-directions.md` « privilégier des fichiers .svg » pour les logos), jugé disproportionné pour un premier livrable — la marque emoji est déjà celle utilisée partout ailleurs dans l'app. `ImageResponse` (Next.js, via `next/og`) rend les emoji en récupérant l'image sur un CDN externe (twemoji) au moment du build : fonctionne sur Vercel (accès internet), accepté comme dépendance de build externe nouvelle.

### Service worker écrit à la main, pas de librairie

Ce dépôt build avec Turbopack. Les librairies usuelles (`next-pwa`, `@ducanh2912/next-pwa`) reposent sur `workbox-webpack-plugin`, un plugin webpack sans intégration Turbopack supportée. `serwist` (successeur maintenu) n'a pas pu être vérifié côté compatibilité Turbopack faute d'accès web en direct au moment de la décision.

Le besoin est explicitement « offline **partiel** » (backlog), pas un offline-first complet. Choix : un service worker minimal (`public/sw.js`, ~70 lignes) plutôt qu'une librairie :
- coquille (page `/offline`) mise en cache à l'installation ;
- `network-only` explicite pour tout `POST` (Server Actions) et `/api/*` (Route Handlers, y compris Better Auth) — jamais de cache d'une réponse authentifiée/personnalisée, important dans une app multi-utilisateurs ;
- navigation : réseau d'abord, repli sur `/offline` en cache si échec ;
- reste (assets statiques) : cache d'abord, réseau en repli, mise en cache opportuniste.

Alternative écartée : `next-pwa`/`@ducanh2912/next-pwa`/`serwist` — risque de rupture avec Turbopack pour les deux premiers, portée (precaching agressif, stratégies multiples) disproportionnée par rapport au besoin réel pour le troisième.

### Détection de mise à jour

`sw.js` appelle `self.skipWaiting()`/`clients.claim()` sans attendre de confirmation utilisateur (pas de handshake `postMessage`). `service-worker-registration.tsx` écoute `navigator.serviceWorker.oncontrollerchange` pour proposer un rechargement (`toast.add(...)`, réutilise l'infrastructure de toasts existante) — mais seulement si un contrôleur existait déjà avant l'enregistrement (`hadController`), pour ne pas afficher « nouvelle version disponible » dès la toute première visite d'un nouvel utilisateur (`controllerchange` se déclenche aussi dans ce cas, pas seulement lors d'une vraie mise à jour).

### Installation : composant dashboard + QR code, détection de fonctionnalité

`<InstallPrompt />` (composant unique, pas deux séparés — même moment UX, deux implémentations) inséré sur le dashboard authentifié (`app/(app)/page.tsx`), masqué tant que l'utilisateur n'a aucune activité enregistrée (même signal que la grille de stats masquée, audit UX U4), déjà installée (`display-mode: standalone`), ou déjà refermée (`localStorage`).

Branchement sur la **détection de fonctionnalité** (l'évènement `beforeinstallprompt` a-t-il été capturé ?), jamais sur un sniffing d'OS/navigateur :
- capturé (Chrome/Edge/Android) : bouton « Installer » réel, appelle `.prompt()` ;
- non capturé (iOS Safari, Firefox, et le cas desktop où l'on veut juste récupérer l'app sur son téléphone) : QR code (`qrcode.react`, seule dépendance ajoutée par cette fonctionnalité) encodant `window.location.origin` (calculé côté client, reste correct en preview/prod sans variable d'environnement) + instructions manuelles.

## Conséquences

Avantages :

- aucun risque de rupture Turbopack (service worker en JS brut, pas d'outil de build impliqué) ;
- portée honnêtement alignée sur le besoin réel (« offline partiel »), rien de plus ;
- contrôle total sur ce qui est mis en cache — pas de risque de fuite d'une réponse personnalisée entre utilisateurs ;
- réutilise l'infrastructure existante (toasts, `lib/app-version.ts`/`components/version-badge.tsx` pour la notion de version déployée) plutôt que d'introduire de nouveaux concepts ;
- QR code + détection de fonctionnalité couvre les deux familles de navigateurs (Chromium avec prompt réel, tout le reste avec un chemin manuel) sans sniffing fragile.

Inconvénients :

- pas de gestion automatique du versioning de cache : le nom de cache (`CACHE_NAME` dans `sw.js`) doit être incrémenté manuellement à chaque modification du service worker, sinon d'anciens fichiers peuvent rester servis ;
- pas de couverture des cas fins qu'une librairie mature gère nativement (stale-while-revalidate, navigation preload...) — acceptable vu la portée réduite, mais une évolution future vers un besoin offline plus riche nécessiterait probablement de revisiter ce choix ;
- installation manuelle et non garantie sur iOS Safari et Firefox (pas de `beforeinstallprompt`) — limite de plateforme, pas quelque chose que ce plan peut corriger ;
- deux marques coexistent : l'emoji 🪂 dans l'UI existante et dans les icônes système générées — accepté en échange de zéro travail graphique pour ce premier livrable ;
- pas de couverture de test automatisé pour le routage du service worker (pas de bundler pour les fichiers `public/sw.js`, donc pas d'import possible depuis un test) ni pour le rendu binaire des icônes (Lighthouse + vérification manuelle restent la méthode de vérification réelle).

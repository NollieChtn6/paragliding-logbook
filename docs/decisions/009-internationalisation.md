# ADR 009 - Internationalisation fr-FR / en-GB : cookie sans préfixe d'URL, mécanique faite main, schémas Zod en fonction-fabrique

## Contexte

Toute l'UI était jusqu'ici en français, codé en dur dans les composants (~97 fichiers `.tsx` sous `src/app/`, `src/features/`, `src/components/`, ~200-400 chaînes traduisibles, ~68 messages de validation Zod répartis sur 10 schémas, 16 sites d'appel `toast.add()`, 4 copies dupliquées d'un `formatDate` figé sur `"fr-FR"`). Terrain entièrement vierge côté i18n : aucune librairie installée, aucun fichier de messages, aucune route `[locale]`.

Demande explicite de l'utilisatrice : ajouter l'anglais britannique (en-GB) à côté du français (fr-FR, langue par défaut), sur l'ensemble de l'app, en une seule livraison. Deux contraintes actées en amont :
- la recherche BAN (adresses d'écoles, ville du profil) reste en français quelle que soit la langue de l'interface — seule l'UI autour (libellés, placeholders) est traduite, la donnée retournée par l'API du gouvernement français est hors périmètre ;
- le sélecteur de langue doit rester visible en permanence dans toute l'app (pas seulement dans les réglages), et non se contenter d'un espace suffisant sur mobile pour empiler thème/réglages/langue.

## Décision

### Pas de préfixe d'URL

La langue est un cookie (`NEXT_LOCALE`, `fr-FR` | `en-GB`, ~1 an), sur le même principe que `ThemeToggle`/`next-themes` pour le thème clair/sombre — `/activities` reste `/activities` dans les deux langues, pas une question de routage.

Alternative écartée : routage `[locale]` (segment de route Next.js dédié à la langue) — écarté par décision explicite de l'utilisatrice, la langue n'étant pas jugée pertinente dans l'URL pour une app à usage personnel/petit cercle.

**Pas de négociation `Accept-Language`** à la première visite : défaut `fr-FR` pur et simple. Reproduit exactement le comportement antérieur pour tout utilisateur existant (aucune régression), le public visé est francophone en priorité (dépendance BAN, cadrage CLAUDE.md), et un utilisateur anglophone dispose d'un `LocaleToggle` à un clic partout où il atterrit — y compris sur `/sign-in` et `/sign-up`, non authentifiées.

### Fait main plutôt que `next-intl`

`next-intl` (librairie la plus mature pour App Router) supporte Next.js 16 depuis sa version 4.4 et propose un mode « sans routage i18n » (cookie, pas de segment `[locale]`) qui aurait convenu à la contrainte ci-dessus. Mais elle n'apporte rien sur la partie réellement difficile de cette migration : les messages de validation Zod (`lib/validations/*.ts`, modules simples, pas des composants React — impossibles à brancher sur un hook `useTranslations()`) et les erreurs construites à la main dans les services (8 fichiers levant des `ZodError` custom après coup, ex. `create-site.service.ts` sur un `spotId` inexistant) doivent de toute façon être résolues à la main, quelle que soit la librairie choisie. C'est l'essentiel du travail réel (68 messages, 8 services) — une librairie n'aide que sur la partie facile (les chaînes JSX).

Ce que `next-intl` aurait apporté (pluriels ICU, tooling d'extraction, `useTranslations()`) ne pesait pas lourd ici : deux locales, pas de règles de pluriel complexes (juste « un »/« autre » résolus vers une chaîne complète par langue, pas un moteur ICU). Ce que ça évitait : un plugin `next.config.ts` supplémentaire à faire cohabiter avec Turbopack (déjà traité avec prudence dans ce dépôt, voir `apps/web/AGENTS.md`), une dépendance de plus à suivre dans le temps, et une deuxième mécanique « comment la traduction arrive à un Client Component » à connaître en plus de celle qui existait déjà et fonctionnait (`ThemeProvider`/`ThemeToggle`).

Choix : réutiliser exactement la forme de `ThemeProvider`/`ThemeToggle` (Context React simple, pas de state manager) pour la partie client (`src/components/locale-provider.tsx`, hooks `useLocale()`/`useT()`), et une fonction-fabrique pour la partie Zod. ~100-150 lignes d'infrastructure (`src/lib/i18n/`).

### Dictionnaires TypeScript, pas JSON

Deux fichiers plats mais namespacés par domaine (`src/messages/fr-FR.ts`, `src/messages/en-GB.ts`), `.ts` et non `.json` : TypeScript vérifie à la compilation que les deux ont exactement la même forme (`Messages`, type partagé) — une clé oubliée dans une langue devient une erreur de build, pas un trou silencieux en prod. `src/messages/index.ts` exporte `getDictionary(locale)`.

### Schémas Zod en fonction-fabrique

Chaque schéma de `lib/validations/*.ts` devient une fonction qui prend sa tranche du dictionnaire et retourne le schéma (`siteSchema(t: Messages["validation"]["site"])`) plutôt qu'une constante figée. Les services qui lèvent en plus des `ZodError` à la main (8 fichiers) reçoivent aussi `t` en paramètre. Chaque Server Action résout `t` une seule fois en haut (`getDictionary(await getLocale())`) et le fait redescendre.

Alternative écartée : `z.config({ customError })`/`z.locales` (Zod v4, `zod@4.4.3`) — état mutable au niveau du process, pas par appel : sur un serveur qui traite en parallèle une requête FR et une requête EN, deux `parse()` concurrents se marcheraient dessus. Écarté aussi pour incompatibilité avec le style existant (messages entièrement personnalisés par champ, pas des templates génériques par type d'erreur).

### `LocaleToggle` partout où `ThemeToggle` l'est déjà, avec repli en menu sur mobile

Demande explicite : le sélecteur de langue ne doit pas être cantonné aux réglages. `LocaleToggle` est donc placé partout où `ThemeToggle` l'est déjà — `DesktopSidebar`, pied de `AdminShell` (desktop), `settings/layout.tsx`, `/sign-in`, `/sign-up`.

Sur les en-têtes mobiles (`AppShell`, `AdminShell`), empiler individuellement thème + langue + réglages de sécurité à côté de la marque et du bouton de déconnexion était trop serré sur un petit écran, en particulier une fois la seconde langue ajoutée à un en-tête déjà chargé. Plutôt que de laisser le rendu se dégrader silencieusement, ces trois contrôles sont consolidés dans `MobileHeaderMenu` (`src/components/layout/mobile-header-menu.tsx`, `DropdownMenu` partagé) — un seul bouton icône « Menu ». La déconnexion reste volontairement en dehors de ce menu, à côté : action sensible qui doit rester visible en un coup d'œil plutôt que masquée derrière un clic supplémentaire.

## Conséquences

Avantages :

- aucune dépendance supplémentaire, aucun plugin `next.config.ts`, zéro risque d'incompatibilité Turbopack ;
- vérification de complétude des deux langues à la compilation (`Messages` partagé) plutôt qu'au runtime ;
- le pattern fonction-fabrique rend la couverture de test des deux langues quasiment gratuite (`describe.each(["fr-FR", "en-GB"])`, le dictionnaire est déjà un paramètre obligatoire) ;
- cohérence totale avec le mécanisme de thème déjà en place — un seul modèle mental à retenir pour « comment une préférence utilisateur circule dans l'app » ;
- sélecteur de langue systématiquement accessible, y compris non authentifié, sans jamais surcharger un en-tête mobile.

Inconvénients :

- pas de pluriels ICU complets (formes `zero`/`few`/`many` d'autres langues) — accepté, seules deux locales à formes de pluriel simples (un/autre) sont couvertes à ce jour ; une troisième langue aux règles de pluriel plus riches nécessiterait de revisiter `pluralize()` ;
- pas d'outillage d'extraction/traduction automatique (les librairies dédiées type `next-intl` en proposent) — chaque nouvelle chaîne doit être ajoutée à la main dans les deux dictionnaires, avec le risque d'oubli mitigé par la vérification de type mais pas par un tooling de détection de chaînes non extraites ;
- `MobileHeaderMenu` diverge de `DesktopSidebar`/pied de `AdminShell` (empilés) : deux présentations différentes du même ensemble de contrôles à maintenir en cohérence si un futur contrôle rejoint ce groupe ;
- la recherche BAN restant volontairement en français quelle que soit la langue de l'interface est une incohérence UX assumée (pas un oubli) pour un utilisateur anglophone recherchant une adresse française.

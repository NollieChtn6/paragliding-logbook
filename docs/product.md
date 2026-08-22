# THERMIK — Vision produit

<!-- impeccable:product-schema 1 -->

## Plateforme

web — application mobile-first, installable en PWA (voir `docs/decisions/008-pwa-installable-manifest-service-worker.md`). Pas de wrapper natif : l'expérience mobile passe entièrement par le web.

## Vision

Créer un carnet de progression parapente numérique permettant de conserver l'historique des pratiques et d'observer son évolution.

L'application doit remplacer progressivement un carnet papier tout en apportant des statistiques et une meilleure analyse personnelle.

---

## Positionnement

Ce qu'un carnet papier ou une prise de notes générique ne fait pas : les activités (vol, stage, gonflage) sont modélisées distinctement, ce qui permet de calculer automatiquement la progression (nombre de vols, temps de vol cumulé, etc.) plutôt que de la comptabiliser à la main.

---

## Utilisateurs

### MVP

Deux utilisateurs maximum :

- pilote principal
- partenaire de pratique

L'architecture doit néanmoins supporter plusieurs utilisateurs.

### Inscription publique

`/sign-up` est ouvert publiquement et protégé par un code d'invitation partagé (mesure anti-abus temporaire, voir `docs/todo.md`). Ce n'est qu'un détail d'implémentation : l'audience visée reste le pilote principal et sa partenaire de pratique, pas un élargissement délibéré à d'autres pilotes. Ne pas concevoir de parcours d'onboarding ou de fonctionnalités pensés pour une audience plus large sans nouvelle confirmation.

---

## Objectifs MVP

Permettre de :

- enregistrer ses activités parapente,
- retrouver son historique,
- mesurer son volume de pratique.

---

## Fonctionnalités MVP

### Activités

Création d'une activité :

- Vol
- Stage
- Gonflage

Affichage chronologique.

---

## Vols

Un vol contient :

- date
- site
- altitude décollage
- altitude atterrissage
- durée
- type
- observations
- points d'amélioration

Un vol peut être associé à un stage.

---

## Stages

Un stage contient :

- période
- école
- type
- bilan
- certification éventuelle

---

## Gonflage

Une séance contient :

- date
- site
- durée
- exercices

---

## Statistiques MVP

Afficher :

- nombre de vols
- temps total de vol
- temps total de gonflage
- nombre de stages

---

## Hors périmètre MVP

Les fonctionnalités suivantes sont volontairement repoussées :

- météo
- GPS
- import IGC
- cartes
- matériel
- analyse automatique
- intégrations externes

Nuance : `/admin/map` existe déjà, mais c'est un outil interne pour gérer visuellement le référentiel spots/sites (rôle ADMIN uniquement) — pas la fonctionnalité "cartes interactives" listée ci-dessus, qui reste une fonctionnalité utilisateur final hors périmètre.

---

## Contexte d'utilisation

Usage principal : saisie juste après un vol, souvent depuis le terrain (mobile, connexion possiblement faible). D'où l'exigence "minimum de saisie" des Principes UX ci-dessous.

Le rôle ADMIN gère les référentiels partagés (spots, sites, écoles — voir `docs/admin.md`) dans une interface séparée (`/admin`, `AdminShell`) de l'application principale (`AppShell`) ; un compte ADMIN n'a jamais accès à l'application principale et en est systématiquement redirigé.

## Capacités et contraintes actuelles

Au-delà du périmètre fonctionnel MVP décrit plus haut, ce qui est réellement construit et durable :

- **Authentification** : Better Auth (email + mot de passe, hash Argon2), inscription publique protégée par code d'invitation, rate limiting sur connexion/inscription, changement de mot de passe et de profil.
- **Référentiels partagés admin** : CRUD complet spots/sites/écoles, suppression toujours bloquée si l'entité est encore référencée (jamais de suppression en cascade silencieuse) — voir `docs/admin.md`.
- **PWA** : application installable, service worker minimal avec page de repli hors-ligne.
- **Internationalisation** : interface disponible en français et anglais.
- **Contrainte de sécurité durable** : le `userId` n'est jamais fourni par le client, toujours résolu côté serveur depuis la session (voir CLAUDE.md).

---

## Engagements de marque

- Nom produit : **THERMIK** (dépôt technique : `paragliding-logbook`).
- Sous-titre officiel : *Carnet de vols & progression*.
- Signature courte (usage ponctuel dans l'UI) : *Voler · Apprendre · Progresser*.

---

## Éléments de preuve disponibles

Des vols et séances réels sont déjà enregistrés dans l'application par son utilisatrice principale. Traiter ces données comme réelles : ne pas inventer d'exemples de vols, de statistiques ou de témoignages qui pourraient être confondus avec de vraies données de pratique.

---

## Principes UX

L'application doit être :

- utilisable rapidement après un vol,
- pensée mobile-first,
- avec un minimum de saisie,
- agréable à consulter.

## Principes produit

- La structuration des activités (vol/stage/gonflage) prime sur la liberté de saisie : c'est elle qui rend la progression mesurable automatiquement.
- Les référentiels partagés (spots, sites, écoles) restent centralisés et curés par un rôle ADMIN séparé, jamais saisis librement par l'utilisateur final — pour garder les données cohérentes dans le temps.
- Le produit reste dimensionné pour son audience actuelle (pilote principal + partenaire de pratique) ; l'architecture multi-utilisateurs est une garantie de robustesse, pas un objectif de croissance d'audience.
- Aucune fonctionnalité du backlog futur (docs/todo.md) n'est développée sans demande explicite, même si l'architecture la rendrait facile à ajouter.

## Accessibilité et inclusion

Aucune exigence spécifique n'a été formulée par l'utilisatrice (pas de besoin d'accessibilité particulier identifié à ce jour). Les bonnes pratiques web générales (WCAG AA) s'appliquent par défaut.

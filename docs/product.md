# Paragliding Logbook - Vision produit

## Vision

Créer un carnet de progression parapente numérique permettant de conserver l'historique des pratiques et d'observer son évolution.

L'application doit remplacer progressivement un carnet papier tout en apportant des statistiques et une meilleure analyse personnelle.

---

## Utilisateurs

### MVP

Deux utilisateurs maximum :

- pilote principal
- partenaire de pratique

L'architecture doit néanmoins supporter plusieurs utilisateurs.

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

---

## Principes UX

L'application doit être :

- utilisable rapidement après un vol,
- pensée mobile-first,
- avec un minimum de saisie,
- agréable à consulter.

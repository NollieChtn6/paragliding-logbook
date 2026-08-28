# UI Direction — THERMIK

## Objectif

Définir la direction visuelle et les règles UI de l’application afin de garantir une expérience cohérente sur mobile et desktop.

L’application est un **carnet de bord personnel de parapente** : elle doit être agréable à utiliser après un vol, lisible en extérieur et suffisamment sobre pour être utilisée quotidiennement.

---

## Principes de design

### Mobile first

L’interface est conçue d’abord pour un smartphone :

- largeur cible : **390–430 px**
- interactions tactiles confortables
- navigation basse prioritaire
- une seule colonne sur mobile

Le desktop doit **adapter** les composants existants, pas créer une interface totalement différente.

---

### Ambiance recherchée

Mots-clés :

- ciel
- altitude
- nature
- sérénité
- progression
- carnet personnel
- simplicité

Éviter :

- les interfaces “sport extrême”
- les dashboards financiers
- les couleurs saturées
- les effets visuels excessifs (glassmorphism, gradients lourds, néons, etc.)

---

## Palette

### Mode clair

| Token           | Valeur |
|---              |---      |
| `primary`       | `#2563EB` |
| `primary-dark`  | `#1E40AF` |
| `accent`        | `#F59E0B` |
| `background`    | `#F8FAFC` |
| `surface`       | `#FFFFFF` |
| `muted`         | `#64748B` |
| `border`        | `#E2E8F0` |
| `success`       | `#16A34A` |
| `destructive`   | `#DC2626` |

## Mode sombre

| Token             | Valeur    |
|---                |---        |
| `background`      | `#0F172A` |
| `surface`         | `#111827` |
| `surface-alt`     | `#1E293B` |
| `text-primary`    | `#F8FAFC` |
| `text-secondary`  | `#CBD5E1` |
| `border`          | `#334155` |

Le bleu et l’orange restent les accents principaux dans les deux thèmes.

---

## Typographie

### Police

- Utilisation de polices Open Source (pas de Google Fonts)
- Tranchée depuis : **Plus Jakarta Sans**, auto-hébergée — voir `apps/web/DESIGN.md` > Typography pour le détail à jour (poids, hiérarchie).

### Hiérarchie

#### Titre principal

- `text-3xl`
- `font-semibold`
- `tracking-tight`

#### Titre de section

- `text-lg`
- `font-medium`

#### Texte principal

- `text-sm`
- `leading-6`

#### Texte secondaire

- `text-sm`
- `text-muted-foreground`

#### Valeurs statistiques

- `text-2xl`
- `font-bold`
- `tracking-tight`

---

## Espacements

### Règles générales

- espacement vertical principal : `space-y-6`
- espacement secondaire : `space-y-4`
- padding des pages : `p-4 md:p-6`
- padding des cartes : `p-6`

Ne pas utiliser de composants “collés” les uns aux autres.

---

## Formes et ombres

### Cartes

Utiliser systématiquement :

```tsx
className="rounded-2xl border bg-card shadow-sm"
```

---

## Icônes et visuels

- Utiliser des icônes pertinentes
- Pour les logos et autres illustrations, privilégier des fichiers .svg

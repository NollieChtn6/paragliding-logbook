# ADR 012 - Graphique de répartition par type de vol : barres plutôt que camembert

## Contexte

Le projet n'utilise aucune librairie de graphiques (aucune dépendance chart.js/recharts/d3/etc. dans `apps/web/package.json`) : le seul graphique du produit à ce jour, `TrendChart` (`apps/web/src/components/trend-chart.tsx`), est un SVG minimaliste fait main (polyline + zone teintée), choix déjà assumé par son propre commentaire.

La nouvelle vue de répartition par type de vol (LOCAL, CROSS_COUNTRY, SOARING, THERMAL, TRAINING, OTHER) sur `/progression` doit afficher une proportion — le choix visuel spontané pour ce genre de donnée est un camembert/donut, mais celui-ci demande de calculer des arcs SVG (angles, grands/petits arcs, cas des valeurs à 0 % ou 100 %) : sensiblement plus de code custom à écrire et maintenir qu'un graphique en barres (simples rectangles proportionnels).

## Décision

La répartition par type de vol est affichée en **barres**, jamais en camembert/donut. Même logique que le choix initial de `TrendChart` : en l'absence de librairie de graphiques, on privilégie la forme la plus simple à coder et maintenir à la main plutôt que la plus conventionnelle pour ce type de donnée.

## Conséquences

Avantages :

- code SVG trivial (rectangles proportionnels), cohérent avec la simplicité déjà recherchée pour `TrendChart` ;
- pas de nouveau pattern de calcul géométrique (arcs) à introduire et maintenir.

Inconvénients :

- moins conventionnel qu'un camembert pour lire une proportion au premier coup d'œil ;
- si une librairie de graphiques est introduite un jour, ce choix pourra être révisé sans contrainte technique — juste un changement visuel, aucune donnée ni modèle à migrer.

# ADR 011 - Volume d'usage du matériel : calculé à la volée, jamais stocké

## Contexte

Le modèle `Equipment` (voile/sellette/secours — voir `docs/domain-model.md`) doit permettre d'évaluer l'usure d'un élément : temps de pratique déjà accumulé, utile pour anticiper une révision ou documenter l'état du matériel au moment d'une revente. Ce volume combine un éventuel volume initial (`initialUsageMin`, saisi manuellement si le matériel a été acheté d'occasion) et la somme des `durationMin` de tous les `Flight`/`GroundHandlingSession` qui référencent cet équipement (`wingId`/`harnessId`/`reserveId`).

Deux approches possibles :

- stocker un total courant sur `Equipment`, mis à jour à chaque création/modification/suppression/déliaison d'une activité qui le référence ;
- calculer ce total à la demande, à partir des activités liées, sans le stocker.

## Décision

Le volume d'usage d'un `Equipment` est **calculé à la volée**, jamais stocké. Même principe déjà retenu pour les statistiques du tableau de bord (`docs/product.md` : "dérivées en mémoire du résultat de `listActivities` — aucune requête Prisma supplémentaire").

## Conséquences

Avantages :

- toujours exact, sans risque de désynchronisation : pas de compteur à maintenir à chaque création/modification/suppression/déliaison d'un `Flight`/`GroundHandlingSession` ;
- cohérent avec l'approche déjà retenue pour les statistiques du tableau de bord, pas de nouveau pattern à introduire ;
- aucune migration nécessaire si la définition du calcul évolue plus tard.

Inconvénients :

- recalcul à chaque affichage plutôt qu'une simple lecture de colonne — non problématique au volume de données actuel (usage personnel, au plus quelques centaines d'activités), à réévaluer si ce volume grossissait significativement.

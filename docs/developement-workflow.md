# Development Workflow

## Branches

main = production

develop = intégration/test

Toutes les fonctionnalités sont développées dans des branches dédiées.

---

## Commit convention

Le projet suit Conventional Commits.

Exemples :

feat(auth): add login page

feat(flight): add flight creation API

fix(activity): validate activity type

test(prisma): add activity repository tests

chore(ci): configure github actions

Les commits correspondent à des fonctionnalités restreintes, découpées selon leur unité logique.

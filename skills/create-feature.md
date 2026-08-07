# Skill : create-feature

À utiliser lorsqu’une nouvelle fonctionnalité doit être ajoutée au projet **paragliding-logbook**.

## Procédure obligatoire

### 1. Analyse

Résumer :

- le besoin utilisateur ;
- les entités concernées ;
- l’impact éventuel sur le MVP.

---

### 2. Impact base de données

Indiquer :

- nouveaux champs ;
- nouvelles relations ;
- migration Prisma nécessaire ou non.

---

### 3. Validation

Créer ou mettre à jour :

- schémas **Zod** ;
- types TypeScript dérivés ;
- messages d’erreur utilisateur.

---

### 4. API

Pour chaque endpoint :

- méthode HTTP ;
- payload attendu ;
- validation ;
- réponse retournée.

---

### 5. Interface utilisateur

Toujours prévoir :

- formulaire mobile-first ;
- état de chargement ;
- gestion des erreurs ;
- confirmation visuelle du succès.

---

### 6. Tests minimaux

Ajouter :

- tests de validation Zod ;
- tests de logique métier ;
- tests des fonctions utilitaires impactées.

---

### 7. Documentation

Mettre à jour :

- `docs/domain-model.md` si le domaine évolue ;
- `README.md` si une commande ou un comportement change ;
- `CLAUDE.md` uniquement si les règles globales du projet changent.

---

## Règles spécifiques au projet

- Ne jamais introduire de dépendance lourde sans justification.
- Préférer les composants **shadcn/ui** existants.
- Conserver un code compatible **Next.js App Router**.
- Éviter toute fonctionnalité hors du périmètre MVP sans demande explicite.
- Toujours proposer l’implémentation **la plus simple permettant une évolution future raisonnable**.

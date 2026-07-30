# Tests

Tests unitaires des fonctions `load` et des `actions` du site de recettes.

**Un fichier = un cas de test.** Chaque fichier contient un seul `it`, ce qui rend
un échec immédiatement lisible : le nom du fichier dit exactement ce qui est cassé.

## Lancer les tests

```bash
npm test        # mode watch, relance à chaque sauvegarde
npm run test:run # une seule passe (CI, vérification rapide)
```

La vraie base de données n'est **jamais** contactée : `$lib/server/db` et
`$lib/server/auth` sont remplacés par des mocks. La suite tourne donc sans
`DATABASE_URL` et sans serveur MySQL.

## Arborescence

```
dev/
├── setup.ts                  installe les mocks avant chaque fichier de test
├── helpers/
│   ├── mocks.ts              les objets `db` et `auth` mockés
│   ├── faux-db.ts            base en mémoire + mini query builder drizzle
│   └── evenement.ts          faux `event` SvelteKit + utilitaires d'assertion
│
├── accueil/                  8 cas — src/routes/+page.server.ts
├── recette-detail/           3 cas — src/routes/recettes/[id]/
├── mes-recettes/             7 cas — load + action supprimer
├── creer-recette/            8 cas — load + action de création
├── modifier-recette/        11 cas — load + action de modification
├── profil/                   4 cas — load + action signOut
├── profil-public/            3 cas — src/routes/profil/[id]/
└── connexion/                8 cas — load + signInEmail / signUpEmail
```

Soit **52 cas** couvrant les 8 modules `+page.server.ts` du projet.

## Les données de test

`reinitialiserBase()` reconstruit une base propre **avant chaque test** — aucun
test ne dépend d'un autre. Le jeu de données est toujours le même :

| Utilisateurs | Ingrédients | Recettes |
|---|---|---|
| `u1` Alice | `1` Poulet | `10` Poulet au riz (u1) — Poulet + Riz |
| `u2` Bob | `2` Riz | `11` Poulet rôti (u1) — Poulet |
| | `3` Soja | `12` Riz sauté (u2) — Riz + Soja |

Ce trio est choisi pour couvrir le filtrage : une recette a les deux ingrédients
communs, une n'en a qu'un, une appartient à un autre utilisateur.

## Ajouter un cas

Créer `dev/<module>/<ce-qui-est-verifie>.test.ts` :

```ts
import { describe, it, expect } from 'vitest';
import { evenement, sansVoid } from '../helpers/evenement';
import { load } from '../../src/routes/mon-module/+page.server';

describe('load de mon module', () => {
  it('décrit précisément le comportement attendu', async () => {
    const resultat = sansVoid(await load(evenement({ user: { id: 'u1' } })));

    expect(resultat.quelqueChose).toBe('...');
  });
});
```

Rien d'autre à faire : `setup.ts` installe les mocks automatiquement.

### Les helpers utiles

| Helper | Usage |
|---|---|
| `evenement({ url, params, user, headers })` | faux `event` pour un `load` |
| `evenementFormulaire({ champs, params, user })` | faux `event` POST pour une `action` ; un tableau en valeur produit des clés répétées (`ingredient_id`, `quantite`, `unite`) |
| `attraper(() => ...)` | capture la valeur levée par `error()` / `redirect()`, à inspecter avec `isHttpError` / `isRedirect` |
| `sansVoid(resultat)` | affirme au compilateur que le `load` a bien renvoyé un objet |
| `echec(resultat)` | idem pour une `action`, afin de lire `.status` et `.data` d'un `fail()` |
| `base()` | accès direct à la base en mémoire, pour vérifier l'effet d'un insert / update / delete |

### Deux pièges

1. **`error()` et `redirect()` lèvent**, même écrits `return redirect(...)` — c'est
   le comportement de SvelteKit 2. Il faut donc passer par `attraper`, et non
   inspecter la valeur de retour.
2. **`attraper` prend une fonction**, pas une promesse : le `load` de `/connexion`
   est synchrone et lève avant même qu'une promesse existe.

## Ce que la fausse base sait faire

`faux-db.ts` ne réimplémente pas drizzle, seulement ce que les routes utilisent :

```
db.select(projection?).from(table).where(condition)
db.query.<table>.findMany({ where })
db.query.<table>.findFirst({ where, with })
db.insert(table).values(lignes)          → [{ insertId }]
db.update(table).set(valeurs).where(condition)
db.delete(table).where(condition)
```

`eq` et `inArray` sont mockés en objets simples que le filtre sait interpréter.
Toute autre opération lève une erreur explicite (« Colonne non gérée… ») : si un
test échoue là-dessus, c'est qu'il faut étendre `faux-db.ts`.

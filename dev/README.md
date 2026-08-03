# Tests

Tests unitaires des fonctions `load` et des `actions` du site de recettes.

**Un fichier par module.** Chaque dossier regroupe tous les cas d'un même
`+page.server.ts` dans un seul fichier, découpé en `describe` (un par `load` ou
par action) : le nom du `describe` dit quelle fonction est testée, celui du `it`
dit quel comportement est cassé.

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
├── accueil/                 10 cas — src/routes/+page.server.ts
├── recette-detail/          13 cas — src/routes/recettes/[id]/ (dont les j'aime)
├── mes-recettes/             7 cas — load + action supprimer
├── creer-recette/            9 cas — load + action de création
├── modifier-recette/        13 cas — load + action de modification
├── profil/                   4 cas — load + action signOut
├── profil-public/            3 cas — src/routes/profil/[id]/
└── connexion/                8 cas — load + signInEmail / signUpEmail
```

Soit **67 cas** couvrant les 8 modules `+page.server.ts` du projet.

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

Les « j'aime » suivent la même logique — trois comptes différents, et une recette
aimée par son propre auteur :

| Recette | Aimée par | Total |
|---|---|---|
| `10` Poulet au riz | Alice (u1) et Bob (u2) | 2 |
| `11` Poulet rôti | Bob (u2) | 1 |
| `12` Riz sauté | personne | 0 |

## Ajouter un cas

Ouvrir `dev/<module>/<module>.test.ts` et ajouter un `it` dans le `describe` de
la fonction concernée :

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

Pour un module encore non couvert, créer `dev/<module>/<module>.test.ts` : rien
d'autre à faire, `setup.ts` installe les mocks automatiquement.

### Les helpers utiles

| Helper | Usage |
|---|---|
| `evenement({ url, params, user, headers })` | faux `event` pour un `load` |
| `evenementFormulaire({ champs, params, user })` | faux `event` POST pour une `action` ; un tableau en valeur produit des clés répétées (`etape`, `ingredient_id`, `quantite`, `unite`) |
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
db.select(projection?).from(table).where(condition).groupBy(colonne)
db.query.<table>.findMany({ where })
db.query.<table>.findFirst({ where, with })
db.insert(table).values(lignes)          → [{ insertId }]
db.update(table).set(valeurs).where(condition)
db.delete(table).where(condition)
```

`eq`, `inArray`, `and` et `count` sont mockés en objets simples que le filtre et
la projection savent interpréter. `count()` dans une projection déclenche
l'agrégation : une ligne par groupe avec `groupBy`, une seule ligne sinon (même
quand le filtre ne ramène rien, comme en SQL).

Toute autre opération lève une erreur explicite (« Colonne non gérée… ») : si un
test échoue là-dessus, c'est qu'il faut étendre `faux-db.ts`.

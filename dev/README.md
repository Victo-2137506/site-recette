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
├── accueil/                 12 cas — src/routes/+page.server.ts
├── recette-detail/          18 cas — src/routes/recettes/[id]/ (préparations + j'aime)
├── mes-recettes/             8 cas — load + action supprimer
├── creer-recette/           12 cas — load + action de création
├── modifier-recette/        16 cas — load + action de modification
├── profil/                   7 cas — load + action signOut
├── profil-public/            3 cas — src/routes/profil/[id]/
└── connexion/                8 cas — load + signInEmail / signUpEmail
```

Soit **84 cas** couvrant les 8 modules `+page.server.ts` du projet.

## Les données de test

`reinitialiserBase()` reconstruit une base propre **avant chaque test** — aucun
test ne dépend d'un autre. Le jeu de données est toujours le même.

Une recette n'a plus d'étapes ni d'ingrédients à elle : elle est découpée en
**préparations**, et ce sont elles qui portent les étapes et les ingrédients.

| Recette | Préparations | Ingrédients |
|---|---|---|
| `10` Poulet au riz (u1) | `100` Marinade, `101` Cuisson | Poulet dans la marinade, Riz dans la cuisson |
| `11` Poulet rôti (u1) | `102` Préparation | Poulet |
| `12` Riz sauté (u2) | `103` Wok | Riz + Soja |

Utilisateurs : `u1` Alice, `u2` Bob. Ingrédients : `1` Poulet, `2` Riz, `3` Soja.

Ce trio est choisi pour couvrir le filtrage : une recette a les deux ingrédients
communs, une n'en a qu'un, une appartient à un autre utilisateur. La recette 10
est volontairement coupée en deux préparations, ses deux ingrédients étant dans
des préparations différentes : c'est ce qui vérifie que le filtrage de l'accueil
raisonne bien à l'échelle de la recette, et non de la préparation.

Les « j'aime » suivent la même logique — trois comptes différents, et une recette
aimée par son propre auteur :

| Recette | Aimée par | Total |
|---|---|---|
| `10` Poulet au riz | Alice (u1) et Bob (u2) | 2 |
| `11` Poulet rôti | Bob (u2) | 1 |
| `12` Riz sauté | personne | 0 |

## Les formulaires de création et de modification

Les deux formulaires envoient les mêmes champs répétés. Chaque étape et chaque
ligne d'ingrédient porte l'index de la préparation à laquelle elle appartient :

| Champ | Rôle |
|---|---|
| `preparation_nom` | un par préparation, dans l'ordre d'affichage |
| `etape` + `etape_preparation_index` | le texte d'une étape et sa préparation |
| `ingredient_id`, `quantite`, `unite` + `preparation_index` | une ligne d'ingrédient et sa préparation |

`evenementFormulaire` reproduit ces répétitions en passant un tableau :

```ts
evenementFormulaire({
  user: { id: 'u1' },
  champs: {
    titre: 'Tarte aux pommes',
    preparation_nom: ['Pâte', 'Garniture'],
    etape: ['Mélanger la farine', 'Étaler', 'Couper les pommes'],
    etape_preparation_index: ['0', '0', '1'],
  },
});
```

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
| `evenementFormulaire({ champs, params, user })` | faux `event` POST pour une `action` ; un tableau en valeur produit des clés répétées |
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

## Trois cas de non-régression

Trois tests protègent des bugs corrigés depuis le passage aux préparations. Ils
sont plus subtils que les autres, d'où ce rappel de ce qu'ils surveillent :

- `accueil` — *ne compte qu'une fois un ingrédient répété dans deux
  préparations* : la jointure ramène une ligne par association, il faut donc
  compter les ingrédients **distincts** et non les lignes, sinon une recette
  peut passer le filtre sans avoir toute la sélection ;
- `creer-recette` — *n'enregistre rien du tout quand une préparation est
  refusée* ;
- `modifier-recette` — *conserve la recette d'origine quand une préparation est
  refusée* : la mise à jour commence par supprimer les préparations existantes,
  toute validation doit donc précéder la première écriture.

Ces deux derniers tiennent parce que les actions assemblent et valident toutes
les préparations avant d'écrire. Reste une limite : si la base tombe **pendant**
la série d'insertions, l'écriture est partielle. Seule une transaction
(`db.transaction`) couvrirait aussi ce cas.

## Ce que la fausse base sait faire

`faux-db.ts` ne réimplémente pas drizzle, seulement ce que les routes utilisent :

```
db.select(projection?).from(table).innerJoin(table, condition)
                      .where(condition).groupBy(colonne)
db.query.<table>.findMany({ where, with })
db.query.<table>.findFirst({ where, with })
db.insert(table).values(lignes)          → [{ insertId }]
db.update(table).set(valeurs).where(condition)
db.delete(table).where(condition)
```

`eq`, `inArray`, `and` et `count` sont mockés en objets simples que le filtre et
la projection savent interpréter. `count()` dans une projection déclenche
l'agrégation : une ligne par groupe avec `groupBy`, une seule ligne sinon (même
quand le filtre ne ramène rien, comme en SQL).

`db.delete` applique les cascades déclarées dans le schéma : supprimer une
recette emporte ses préparations et ses « j'aime », supprimer une préparation
emporte ses associations d'ingrédients. L'action de modification s'appuie
dessus — elle supprime les préparations sans jamais toucher aux ingrédients.

Toute autre opération lève une erreur explicite (« Colonne non gérée… ») : si un
test échoue là-dessus, c'est qu'il faut étendre `faux-db.ts`.

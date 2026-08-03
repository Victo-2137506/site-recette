// Fausse base de données en mémoire.
//
// La vraie base n'est jamais contactée : `$lib/server/db` est remplacé par
// `mocks.db` (voir `dev/setup.ts`), et ce fichier remplit cet objet avec un
// mini « query builder » qui comprend les quelques opérations drizzle
// réellement utilisées par les routes :
//
//   db.select(projection?).from(table).where(condition).groupBy(colonne)
//   db.query.<table>.findMany({ where })
//   db.query.<table>.findFirst({ where, with })
//   db.insert(table).values(lignes)
//   db.update(table).set(valeurs).where(condition)
//   db.delete(table).where(condition)
//
// `eq`, `inArray`, `and` et `count` sont mockés en objets simples
// ({ type, colonne, valeur }) que `filtrer` et `projeter` savent interpréter.

import { vi } from 'vitest';
import {
  recettes,
  ingredients,
  recetteIngredients,
  utilisateurs,
  jaime,
} from '$lib/server/db/schema';
import { mocks } from './mocks';

// --- Types des lignes stockées ---

export type LigneUtilisateur = { id: string; nom: string; email: string };
export type LigneIngredient = { id: number; nom: string };
export type LigneRecette = {
  id: number;
  titre: string;
  description: string | null;
  etapes: string;
  utilisateurId: string;
};
export type LigneRecetteIngredient = {
  recetteId: number;
  ingredientId: number;
  quantite: string;
  unite: string | null;
};
export type LigneJaime = {
  utilisateurId: string;
  recetteId: number;
  creeLe: Date;
};

export type Base = {
  utilisateurs: LigneUtilisateur[];
  ingredients: LigneIngredient[];
  recettes: LigneRecette[];
  recetteIngredients: LigneRecetteIngredient[];
  jaime: LigneJaime[];
};

// État courant, reconstruit avant chaque test par `reinitialiserBase()`.
let donnees: Base;

// Donne accès au contenu de la base depuis un test, pour vérifier l'effet
// d'une insertion, d'une mise à jour ou d'une suppression.
export function base(): Base {
  return donnees;
}

// --- Traduction des colonnes drizzle ---

// Associe une colonne drizzle à la clé correspondante dans nos objets de test.
function cleColonne(colonne: unknown): string {
  if (colonne === recettes.id) return 'id';
  if (colonne === recettes.titre) return 'titre';
  if (colonne === recettes.utilisateurId) return 'utilisateurId';
  if (colonne === recetteIngredients.recetteId) return 'recetteId';
  if (colonne === recetteIngredients.ingredientId) return 'ingredientId';
  if (colonne === ingredients.id) return 'id';
  if (colonne === ingredients.nom) return 'nom';
  if (colonne === utilisateurs.id) return 'id';
  if (colonne === jaime.recetteId) return 'recetteId';
  if (colonne === jaime.utilisateurId) return 'utilisateurId';
  throw new Error('Colonne non gérée par le mock de base de données');
}

type Condition = {
  type: string;
  colonne?: unknown;
  valeur?: unknown;
  valeurs?: unknown[];
  conditions?: Condition[];
};

// Applique une condition `eq`, `inArray` ou `and` sur un tableau de lignes.
function filtrer<T extends Record<string, unknown>>(
  lignes: T[],
  condition: Condition | undefined,
): T[] {
  if (!condition) return lignes;

  // `and` combine ses sous-conditions : chacune restreint le résultat de la
  // précédente. C'est le cas des actions sur les « j'aime », identifiés par le
  // couple (recette, utilisateur).
  if (condition.type === 'and') {
    return (condition.conditions ?? []).reduce(
      (restantes, sous) => filtrer(restantes, sous),
      lignes,
    );
  }

  const cle = cleColonne(condition.colonne);

  if (condition.type === 'eq') {
    return lignes.filter((ligne) => ligne[cle] === condition.valeur);
  }
  if (condition.type === 'inArray') {
    return lignes.filter((ligne) => condition.valeurs!.includes(ligne[cle]));
  }
  throw new Error(`Condition non gérée : ${condition.type}`);
}

// Renvoie le tableau de stockage correspondant à une table drizzle.
function lignesDe(table: unknown): Record<string, unknown>[] {
  if (table === recettes) return donnees.recettes;
  if (table === ingredients) return donnees.ingredients;
  if (table === recetteIngredients) return donnees.recetteIngredients;
  if (table === utilisateurs) return donnees.utilisateurs;
  if (table === jaime) return donnees.jaime;
  throw new Error('Table non gérée par le mock de base de données');
}

// `count()` est mocké en `{ type: 'count' }` : dans une projection, cette valeur
// ne désigne pas une colonne à lire mais un nombre de lignes à calculer.
function estCount(valeur: unknown): boolean {
  return (
    typeof valeur === 'object' &&
    valeur !== null &&
    (valeur as { type?: string }).type === 'count'
  );
}

// Construit une ligne de résultat à partir d'un groupe de lignes : les alias
// `count()` reçoivent la taille du groupe, les autres la valeur de la colonne.
function ligneProjetee(
  groupe: Record<string, unknown>[],
  projection: Record<string, unknown>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(projection).map(([alias, colonne]) => [
      alias,
      estCount(colonne) ? groupe.length : groupe[0]?.[cleColonne(colonne)],
    ]),
  );
}

// Ne garde que les colonnes demandées dans `db.select({ ... })`, et applique
// l'agrégation quand la projection contient un `count()`.
function projeter(
  lignes: Record<string, unknown>[],
  projection?: Record<string, unknown>,
  groupe?: unknown,
): Record<string, unknown>[] {
  if (!projection) return lignes;

  if (!Object.values(projection).some(estCount)) {
    return lignes.map((ligne) => ligneProjetee([ligne], projection));
  }

  // Sans `groupBy`, un agrégat SQL renvoie toujours exactement une ligne,
  // y compris quand le filtre ne ramène rien (le compte vaut alors 0).
  if (groupe === undefined) return [ligneProjetee(lignes, projection)];

  const cle = cleColonne(groupe);
  const groupes = new Map<unknown, Record<string, unknown>[]>();

  for (const ligne of lignes) {
    const valeur = ligne[cle];
    if (!groupes.has(valeur)) groupes.set(valeur, []);
    groupes.get(valeur)!.push(ligne);
  }

  return [...groupes.values()].map((lignesDuGroupe) =>
    ligneProjetee(lignesDuGroupe, projection),
  );
}

// --- SELECT ---

// Un « query builder » minimal : chaînable via `.where()` / `.groupBy()` et
// attendable via `await`. La copie du tableau à la résolution évite qu'un test
// observe des mutations faites après la lecture.
function requete(
  lignes: Record<string, unknown>[],
  projection?: Record<string, unknown>,
  groupe?: unknown,
) {
  return {
    where: (condition: Condition) =>
      requete(filtrer(lignes, condition), projection, groupe),
    groupBy: (colonne: unknown) => requete(lignes, projection, colonne),
    then: (ok: (v: unknown) => unknown, ko?: (e: unknown) => unknown) =>
      Promise.resolve(projeter([...lignes], projection, groupe)).then(ok, ko),
  };
}

// --- Relations (`with`) de `findFirst` / `findMany` ---

// Attache à une recette les relations demandées. Deux formes sont utilisées
// par les routes : `recetteIngredients: true` (modifier) et
// `recetteIngredients: { with: { ingredient: true } }` (détail d'une recette).
function attacherRelations(
  recette: LigneRecette,
  avec: Record<string, unknown>,
): Record<string, unknown> {
  const resultat: Record<string, unknown> = { ...recette };

  if (avec.utilisateur) {
    resultat.utilisateur = donnees.utilisateurs.find(
      (u) => u.id === recette.utilisateurId,
    );
  }

  if (avec.recetteIngredients) {
    const imbriqueIngredient =
      typeof avec.recetteIngredients === 'object' &&
      Boolean((avec.recetteIngredients as { with?: { ingredient?: boolean } }).with?.ingredient);

    resultat.recetteIngredients = donnees.recetteIngredients
      .filter((ri) => ri.recetteId === recette.id)
      .map((ri) =>
        imbriqueIngredient
          ? {
              ...ri,
              ingredient: donnees.ingredients.find((i) => i.id === ri.ingredientId),
            }
          : { ...ri },
      );
  }

  return resultat;
}

// --- INSERT / UPDATE / DELETE ---

// Calcule le prochain identifiant auto-incrémenté d'une table.
function prochainId(lignes: { id: number }[]): number {
  return lignes.reduce((max, ligne) => Math.max(max, ligne.id), 0) + 1;
}

// `db.insert(table).values(...)` : accepte un objet seul ou un tableau.
// Résout vers `[{ insertId }]`, la forme renvoyée par le driver mysql2 et
// attendue par l'action de création de recette.
function inserer(table: unknown, valeurs: unknown) {
  const nouvelles = Array.isArray(valeurs) ? valeurs : [valeurs];
  const cible = lignesDe(table);
  let insertId = 0;

  for (const valeur of nouvelles) {
    const ligne = { ...(valeur as Record<string, unknown>) };

    // Seules `recettes` et `ingredients` ont une clé auto-incrémentée ;
    // `recette_ingredients` et `jaime` ont une clé primaire composite.
    if (table === recettes || table === ingredients) {
      insertId = prochainId(cible as { id: number }[]);
      ligne.id = insertId;
    }

    // `creeLe` est un `defaultNow()` en base : la route ne l'envoie jamais.
    if (table === jaime && ligne.creeLe === undefined) ligne.creeLe = new Date();

    cible.push(ligne);
  }

  return Promise.resolve([{ insertId, affectedRows: nouvelles.length }]);
}

// `db.update(table).set(valeurs).where(condition)` : mute les lignes filtrées.
function metAJour(table: unknown, valeurs: Record<string, unknown>) {
  return {
    where: (condition: Condition) => {
      const cibles = filtrer(lignesDe(table), condition);
      for (const ligne of cibles) Object.assign(ligne, valeurs);
      return Promise.resolve([{ affectedRows: cibles.length }]);
    },
  };
}

// `db.delete(table).where(condition)` : retire les lignes filtrées, en place
// pour que la référence exposée par `base()` reste valable.
function supprimer(table: unknown) {
  return {
    where: (condition: Condition) => {
      const stockage = lignesDe(table);
      const aSupprimer = new Set(filtrer(stockage, condition));
      const restantes = stockage.filter((ligne) => !aSupprimer.has(ligne));
      stockage.splice(0, stockage.length, ...restantes);
      return Promise.resolve([{ affectedRows: aSupprimer.size }]);
    },
  };
}

// --- Réinitialisation ---

// Reconstruit une base propre et réinstalle tous les mocks.
// Appelé automatiquement avant chaque test par `dev/setup.ts`.
export function reinitialiserBase() {
  donnees = {
    utilisateurs: [
      { id: 'u1', nom: 'Alice', email: 'alice@test.fr' },
      { id: 'u2', nom: 'Bob', email: 'bob@test.fr' },
    ],
    ingredients: [
      { id: 1, nom: 'Poulet' },
      { id: 2, nom: 'Riz' },
      { id: 3, nom: 'Soja' },
    ],
    recettes: [
      // Poulet + Riz
      { id: 10, titre: 'Poulet au riz', description: 'Simple', etapes: 'Cuire', utilisateurId: 'u1' },
      // Poulet seulement
      { id: 11, titre: 'Poulet rôti', description: null, etapes: 'Rôtir', utilisateurId: 'u1' },
      // Riz + Soja
      { id: 12, titre: 'Riz sauté', description: 'Wok', etapes: 'Sauter', utilisateurId: 'u2' },
    ],
    recetteIngredients: [
      { recetteId: 10, ingredientId: 1, quantite: '200', unite: 'g' },
      { recetteId: 10, ingredientId: 2, quantite: '150', unite: 'g' },
      { recetteId: 11, ingredientId: 1, quantite: '1', unite: null },
      { recetteId: 12, ingredientId: 2, quantite: '100', unite: 'g' },
      { recetteId: 12, ingredientId: 3, quantite: '2', unite: 'c. à s.' },
    ],
    // Trois comptes différents (2, 1 et 0 j'aime) et une recette aimée par son
    // propre auteur : de quoi couvrir le compteur comme l'état du bouton.
    jaime: [
      { utilisateurId: 'u1', recetteId: 10, creeLe: new Date('2026-01-01') },
      { utilisateurId: 'u2', recetteId: 10, creeLe: new Date('2026-01-02') },
      { utilisateurId: 'u2', recetteId: 11, creeLe: new Date('2026-01-03') },
    ],
  };

  mocks.db.select = vi.fn((projection?: Record<string, unknown>) => ({
    from: (table: unknown) => requete(lignesDe(table), projection),
  }));

  mocks.db.insert = vi.fn((table: unknown) => ({
    values: (valeurs: unknown) => inserer(table, valeurs),
  }));

  mocks.db.update = vi.fn((table: unknown) => ({
    set: (valeurs: Record<string, unknown>) => metAJour(table, valeurs),
  }));

  mocks.db.delete = vi.fn((table: unknown) => supprimer(table));

  mocks.db.query = {
    recettes: {
      findMany: async (options: { where?: Condition } = {}) => [
        ...filtrer(donnees.recettes, options.where),
      ],
      findFirst: async (
        options: { where?: Condition; with?: Record<string, unknown> } = {},
      ) => {
        const recette = filtrer(donnees.recettes, options.where)[0];
        if (!recette) return undefined;
        if (!options.with) return { ...recette };
        return attacherRelations(recette, options.with);
      },
    },
    utilisateurs: {
      findFirst: async (options: { where?: Condition } = {}) => {
        const utilisateur = filtrer(donnees.utilisateurs, options.where)[0];
        return utilisateur ? { ...utilisateur } : undefined;
      },
    },
    jaime: {
      findFirst: async (options: { where?: Condition } = {}) => {
        const like = filtrer(donnees.jaime, options.where)[0];
        return like ? { ...like } : undefined;
      },
    },
  };

  // Par défaut l'authentification réussit ; un test peut surcharger ces mocks
  // pour simuler une erreur.
  mocks.auth.api.signOut = vi.fn(async () => ({ success: true }));
  mocks.auth.api.signInEmail = vi.fn(async () => ({ redirect: false }));
  mocks.auth.api.signUpEmail = vi.fn(async () => ({ redirect: false }));
}

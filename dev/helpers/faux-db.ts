// Fausse base de données en mémoire.
//
// La vraie base n'est jamais contactée : `$lib/server/db` est remplacé par
// `mocks.db` (voir `dev/setup.ts`), et ce fichier remplit cet objet avec un
// mini « query builder » qui comprend les quelques opérations drizzle
// réellement utilisées par les routes :
//
//   db.select(projection?).from(table).innerJoin(table, condition)
//                         .where(condition).groupBy(colonne)
//   db.query.<table>.findMany({ where, with })
//   db.query.<table>.findFirst({ where, with })
//   db.insert(table).values(lignes)
//   db.update(table).set(valeurs).where(condition)
//   db.delete(table).where(condition)          (avec suppression en cascade)
//
// `eq`, `inArray`, `and` et `count` sont mockés en objets simples
// ({ type, colonne, valeur }) que `filtrer` et `projeter` savent interpréter.

import { vi } from 'vitest';
import {
  recettes,
  preparations,
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
  utilisateurId: string;
};
// Une recette est découpée en préparations (« Pâte », « Garniture »...) :
// ce sont elles qui portent les étapes et les ingrédients.
export type LignePreparation = {
  id: number;
  nom: string;
  ordre: number;
  etapes: string;
  recetteId: number;
};
export type LigneRecetteIngredient = {
  preparationId: number;
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
  preparations: LignePreparation[];
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

// Associe chaque colonne drizzle à sa table et à la clé correspondante dans nos
// objets de test. La table sert aux jointures, qui doivent savoir de quel côté
// de la condition se trouve chaque colonne.
const colonnes = new Map<unknown, { table: unknown; cle: string }>([
  [recettes.id, { table: recettes, cle: 'id' }],
  [recettes.titre, { table: recettes, cle: 'titre' }],
  [recettes.utilisateurId, { table: recettes, cle: 'utilisateurId' }],
  [preparations.id, { table: preparations, cle: 'id' }],
  [preparations.nom, { table: preparations, cle: 'nom' }],
  [preparations.ordre, { table: preparations, cle: 'ordre' }],
  [preparations.recetteId, { table: preparations, cle: 'recetteId' }],
  [recetteIngredients.preparationId, {
    table: recetteIngredients,
    cle: 'preparationId',
  }],
  [recetteIngredients.ingredientId, {
    table: recetteIngredients,
    cle: 'ingredientId',
  }],
  [ingredients.id, { table: ingredients, cle: 'id' }],
  [ingredients.nom, { table: ingredients, cle: 'nom' }],
  [utilisateurs.id, { table: utilisateurs, cle: 'id' }],
  [jaime.recetteId, { table: jaime, cle: 'recetteId' }],
  [jaime.utilisateurId, { table: jaime, cle: 'utilisateurId' }],
]);

function infoColonne(colonne: unknown): { table: unknown; cle: string } {
  const info = colonnes.get(colonne);
  if (!info) throw new Error('Colonne non gérée par le mock de base de données');
  return info;
}

function cleColonne(colonne: unknown): string {
  return infoColonne(colonne).cle;
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
  if (table === preparations) return donnees.preparations;
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

// `innerJoin(table, eq(colonneA, colonneB))` : chaque ligne déjà sélectionnée
// est fusionnée avec les lignes de la table jointe qui satisfont la condition.
// Les colonnes des deux tables portent des noms distincts, une simple fusion
// d'objets suffit donc à représenter la ligne jointe.
function joindre(
  lignes: Record<string, unknown>[],
  table: unknown,
  condition: Condition,
): Record<string, unknown>[] {
  if (condition.type !== 'eq') {
    throw new Error(`Jointure non gérée : ${condition.type}`);
  }

  // La condition relie deux colonnes : on repère laquelle appartient à la
  // table jointe, l'autre désigne forcément la ligne de gauche.
  const gauche = infoColonne(condition.colonne);
  const droite = infoColonne(condition.valeur);
  const [surTableJointe, surLigneCourante] =
    droite.table === table ? [droite, gauche] : [gauche, droite];

  return lignes.flatMap((ligne) =>
    lignesDe(table)
      .filter((jointe) => jointe[surTableJointe.cle] === ligne[surLigneCourante.cle])
      .map((jointe) => ({ ...ligne, ...jointe })),
  );
}

// Un « query builder » minimal : chaînable via `.innerJoin()` / `.where()` /
// `.groupBy()` et attendable via `await`. La copie du tableau à la résolution
// évite qu'un test observe des mutations faites après la lecture.
function requete(
  lignes: Record<string, unknown>[],
  projection?: Record<string, unknown>,
  groupe?: unknown,
) {
  return {
    innerJoin: (table: unknown, condition: Condition) =>
      requete(joindre(lignes, table, condition), projection, groupe),
    where: (condition: Condition) =>
      requete(filtrer(lignes, condition), projection, groupe),
    groupBy: (colonne: unknown) => requete(lignes, projection, colonne),
    then: (ok: (v: unknown) => unknown, ko?: (e: unknown) => unknown) =>
      Promise.resolve(projeter([...lignes], projection, groupe)).then(ok, ko),
  };
}

// --- Relations (`with`) de `findFirst` / `findMany` ---

// Une préparation et, si la route les demande, ses associations d'ingrédients.
// Deux formes sont utilisées : `recetteIngredients: true` (modification) et
// `recetteIngredients: { with: { ingredient: true } }` (détail d'une recette).
function attacherRelationsPreparation(
  preparation: LignePreparation,
  avec: Record<string, unknown>,
): Record<string, unknown> {
  const resultat: Record<string, unknown> = { ...preparation };

  if (avec.recetteIngredients) {
    const imbriqueIngredient = Boolean(
      (avec.recetteIngredients as { with?: { ingredient?: boolean } }).with
        ?.ingredient,
    );

    resultat.recetteIngredients = donnees.recetteIngredients
      .filter((ri) => ri.preparationId === preparation.id)
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

// Une recette et ses relations : son auteur et ses préparations, chacune
// pouvant à son tour embarquer ses ingrédients.
function attacherRelationsRecette(
  recette: LigneRecette,
  avec: Record<string, unknown>,
): Record<string, unknown> {
  const resultat: Record<string, unknown> = { ...recette };

  if (avec.utilisateur) {
    resultat.utilisateur = donnees.utilisateurs.find(
      (u) => u.id === recette.utilisateurId,
    );
  }

  if (avec.preparations) {
    const sous =
      ((avec.preparations as { with?: Record<string, unknown> }).with ?? {});

    // Comme en base, l'ordre d'insertion est conservé : les routes s'appuient
    // sur la colonne `ordre` pour l'affichage, pas sur un tri de la requête.
    resultat.preparations = donnees.preparations
      .filter((p) => p.recetteId === recette.id)
      .map((p) => attacherRelationsPreparation(p, sous));
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
// attendue par les actions de création et de modification.
function inserer(table: unknown, valeurs: unknown) {
  const nouvelles = Array.isArray(valeurs) ? valeurs : [valeurs];
  const cible = lignesDe(table);
  let insertId = 0;

  for (const valeur of nouvelles) {
    const ligne = { ...(valeur as Record<string, unknown>) };

    // `recettes`, `preparations` et `ingredients` ont une clé auto-incrémentée ;
    // `recette_ingredients` et `jaime` ont une clé primaire composite.
    if (table === recettes || table === preparations || table === ingredients) {
      insertId = prochainId(cible as { id: number }[]);
      ligne.id = insertId;
    }

    // `ordre` et `creeLe` ont une valeur par défaut en base : la route peut
    // donc ne pas les envoyer.
    if (table === preparations && ligne.ordre === undefined) ligne.ordre = 0;
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

// Reproduit les `onDelete: 'cascade'` déclarés dans le schéma : supprimer une
// recette emporte ses préparations et ses « j'aime », supprimer une préparation
// emporte ses associations d'ingrédients. L'action de modification s'appuie
// dessus — elle supprime les préparations sans toucher aux ingrédients.
function cascader(table: unknown, partantes: Record<string, unknown>[]) {
  if (table === recettes) {
    const ids = new Set(partantes.map((r) => r.id));
    retirer(preparations, (p) => ids.has(p.recetteId));
    retirer(jaime, (j) => ids.has(j.recetteId));
  }

  if (table === preparations) {
    const ids = new Set(partantes.map((p) => p.id));
    retirer(recetteIngredients, (ri) => ids.has(ri.preparationId));
  }
}

// Retire les lignes vérifiant un prédicat, en place pour que la référence
// exposée par `base()` reste valable, puis applique les cascades.
function retirer(
  table: unknown,
  predicat: (ligne: Record<string, any>) => boolean,
): number {
  const stockage = lignesDe(table);
  const partantes = stockage.filter(predicat);
  if (partantes.length === 0) return 0;

  const aSupprimer = new Set(partantes);
  const restantes = stockage.filter((ligne) => !aSupprimer.has(ligne));
  stockage.splice(0, stockage.length, ...restantes);

  cascader(table, partantes);
  return partantes.length;
}

// `db.delete(table).where(condition)`.
function supprimer(table: unknown) {
  return {
    where: (condition: Condition) => {
      const cibles = new Set(filtrer(lignesDe(table), condition));
      const total = retirer(table, (ligne) => cibles.has(ligne));
      return Promise.resolve([{ affectedRows: total }]);
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
      // Poulet + Riz, répartis sur deux préparations
      { id: 10, titre: 'Poulet au riz', description: 'Simple', utilisateurId: 'u1' },
      // Poulet seulement, une seule préparation
      { id: 11, titre: 'Poulet rôti', description: null, utilisateurId: 'u1' },
      // Riz + Soja, une seule préparation
      { id: 12, titre: 'Riz sauté', description: 'Wok', utilisateurId: 'u2' },
    ],
    // La recette 10 est volontairement découpée en deux préparations : ses deux
    // ingrédients sont dans des préparations différentes, ce qui vérifie que le
    // filtrage de l'accueil raisonne bien à l'échelle de la recette.
    preparations: [
      { id: 100, nom: 'Marinade', ordre: 0, etapes: '1. Mélanger', recetteId: 10 },
      { id: 101, nom: 'Cuisson', ordre: 1, etapes: '1. Cuire le riz\n2. Ajouter le poulet', recetteId: 10 },
      { id: 102, nom: 'Préparation', ordre: 0, etapes: '1. Rôtir', recetteId: 11 },
      { id: 103, nom: 'Wok', ordre: 0, etapes: '1. Sauter', recetteId: 12 },
    ],
    recetteIngredients: [
      { preparationId: 100, ingredientId: 1, quantite: '200', unite: 'g' },
      { preparationId: 101, ingredientId: 2, quantite: '150', unite: 'g' },
      { preparationId: 102, ingredientId: 1, quantite: '1', unite: null },
      { preparationId: 103, ingredientId: 2, quantite: '100', unite: 'g' },
      { preparationId: 103, ingredientId: 3, quantite: '2', unite: 'c. à s.' },
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
        return attacherRelationsRecette(recette, options.with);
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
      // Le profil liste les recettes aimées : chaque ligne embarque sa recette,
      // `null` si elle n'existe plus (ce que la route filtre).
      findMany: async (
        options: { where?: Condition; with?: Record<string, unknown> } = {},
      ) =>
        filtrer(donnees.jaime, options.where).map((like) =>
          options.with?.recette
            ? {
                ...like,
                recette:
                  donnees.recettes.find((r) => r.id === like.recetteId) ?? null,
              }
            : { ...like },
        ),
    },
  };

  // Par défaut l'authentification réussit ; un test peut surcharger ces mocks
  // pour simuler une erreur.
  mocks.auth.api.signOut = vi.fn(async () => ({ success: true }));
  mocks.auth.api.signInEmail = vi.fn(async () => ({ redirect: false }));
  mocks.auth.api.signUpEmail = vi.fn(async () => ({ redirect: false }));
}

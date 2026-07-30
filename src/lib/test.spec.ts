// Tests unitaires des fonctions `load` et des actions du site de recettes.
// Lancement : npm test
//
// La base de données n'est jamais contactée : `$lib/server/db` et `$lib/server/auth`
// sont remplacés par des mocks, et une petite base en mémoire simule les requêtes
// drizzle utilisées par les routes (select / where / query.findMany / query.findFirst).

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isHttpError, isRedirect } from '@sveltejs/kit';

// --- Mocks (hissés au-dessus des imports par vitest) ---

const mocks = vi.hoisted(() => ({
  // Objets vides remplis plus bas : les routes importent ces références,
  // il suffit donc de les muter pour piloter leur comportement.
  db: {} as Record<string, unknown>,
  auth: { api: { signOut: vi.fn() } },
}));

vi.mock('$lib/server/db', () => ({ db: mocks.db }));
vi.mock('$lib/server/auth', () => ({ auth: mocks.auth }));

// `eq` et `inArray` sont remplacés par des objets simples que le faux `db`
// sait interpréter. Le reste de drizzle-orm (dont `relations`) reste réel,
// sinon le schéma ne pourrait pas être construit.
vi.mock('drizzle-orm', async (importOriginal) => {
  const reel = await importOriginal<typeof import('drizzle-orm')>();
  return {
    ...reel,
    eq: (colonne: unknown, valeur: unknown) => ({ type: 'eq', colonne, valeur }),
    inArray: (colonne: unknown, valeurs: unknown[]) => ({
      type: 'inArray',
      colonne,
      valeurs,
    }),
  };
});

import {
  recettes,
  ingredients,
  recetteIngredients,
  utilisateurs,
} from '$lib/server/db/schema';

import { load as chargerAccueil } from '../routes/+page.server';
import { load as chargerRecette } from '../routes/recettes/[id]/+page.server';
import { load as chargerMesRecettes } from '../routes/mes-recettes/+page.server';
import {
  load as chargerProfil,
  actions as actionsProfil,
} from '../routes/profil/+page.server';
import { load as chargerProfilPublic } from '../routes/profil/[id]/+page.server';

// --- Fausse base de données en mémoire ---

type LigneRecette = {
  id: number;
  titre: string;
  description: string | null;
  etapes: string;
  utilisateurId: string;
};

type Donnees = {
  utilisateurs: { id: string; nom: string; email: string }[];
  recettes: LigneRecette[];
  ingredients: { id: number; nom: string }[];
  recetteIngredients: {
    recetteId: number;
    ingredientId: number;
    quantite: string;
    unite: string | null;
  }[];
};

let donnees: Donnees;

// Traduit une colonne drizzle vers la clé correspondante dans les objets de test.
function cleColonne(colonne: unknown): string {
  if (colonne === recettes.id) return 'id';
  if (colonne === recettes.utilisateurId) return 'utilisateurId';
  if (colonne === recetteIngredients.recetteId) return 'recetteId';
  if (colonne === recetteIngredients.ingredientId) return 'ingredientId';
  if (colonne === ingredients.id) return 'id';
  if (colonne === utilisateurs.id) return 'id';
  throw new Error('Colonne non gérée par le mock de base de données');
}

// Applique une condition `eq` ou `inArray` sur un tableau de lignes.
function filtrer<T extends Record<string, unknown>>(
  lignes: T[],
  condition: { type: string; colonne: unknown; valeur?: unknown; valeurs?: unknown[] } | undefined,
): T[] {
  if (!condition) return lignes;
  const cle = cleColonne(condition.colonne);

  if (condition.type === 'eq') {
    return lignes.filter((ligne) => ligne[cle] === condition.valeur);
  }
  if (condition.type === 'inArray') {
    return lignes.filter((ligne) => condition.valeurs!.includes(ligne[cle]));
  }
  throw new Error(`Condition non gérée : ${condition.type}`);
}

function lignesDe(table: unknown): Record<string, unknown>[] {
  if (table === recettes) return donnees.recettes;
  if (table === ingredients) return donnees.ingredients;
  if (table === recetteIngredients) return donnees.recetteIngredients;
  if (table === utilisateurs) return donnees.utilisateurs;
  throw new Error('Table non gérée par le mock de base de données');
}

// Ne garde que les colonnes demandées dans `db.select({ ... })`.
function projeter(
  lignes: Record<string, unknown>[],
  projection?: Record<string, unknown>,
): Record<string, unknown>[] {
  if (!projection) return lignes;
  return lignes.map((ligne) =>
    Object.fromEntries(
      Object.entries(projection).map(([alias, colonne]) => [alias, ligne[cleColonne(colonne)]]),
    ),
  );
}

// Un « query builder » minimal : chaînable via `.where()` et attendable via `await`.
function requete(lignes: Record<string, unknown>[], projection?: Record<string, unknown>) {
  return {
    where: (condition: never) => requete(filtrer(lignes, condition), projection),
    then: (ok: (v: unknown) => unknown, ko?: (e: unknown) => unknown) =>
      Promise.resolve(projeter(lignes, projection)).then(ok, ko),
  };
}

// Reconstruit une base propre avant chaque test.
function reinitialiserBase() {
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
  };

  mocks.db.select = vi.fn((projection?: Record<string, unknown>) => ({
    from: (table: unknown) => requete(lignesDe(table), projection),
  }));

  mocks.db.query = {
    recettes: {
      findMany: async (options: { where?: never } = {}) =>
        filtrer(donnees.recettes, options.where),
      findFirst: async (options: { where?: never; with?: unknown } = {}) => {
        const recette = filtrer(donnees.recettes, options.where)[0];
        if (!recette || !options.with) return recette;
        // Simule le chargement des relations demandées par `with`.
        return {
          ...recette,
          utilisateur: donnees.utilisateurs.find((u) => u.id === recette.utilisateurId),
          recetteIngredients: donnees.recetteIngredients
            .filter((ri) => ri.recetteId === recette.id)
            .map((ri) => ({
              ...ri,
              ingredient: donnees.ingredients.find((i) => i.id === ri.ingredientId),
            })),
        };
      },
    },
    utilisateurs: {
      findFirst: async (options: { where?: never } = {}) =>
        filtrer(donnees.utilisateurs, options.where)[0],
    },
  };

  mocks.auth.api.signOut = vi.fn(async () => ({ success: true }));
}

// Fabrique un faux `event` SvelteKit contenant juste ce que les `load` utilisent.
function evenement(options: {
  url?: string;
  params?: Record<string, string>;
  user?: { id: string; nom?: string } | null;
  headers?: Record<string, string>;
}) {
  return {
    url: new URL(options.url ?? 'http://localhost/'),
    params: options.params ?? {},
    locals: { user: options.user ?? null, session: null },
    request: new Request('http://localhost/', { headers: options.headers ?? {} }),
  } as never;
}

// Les fonctions `load` sont typées `PageServerLoad`, dont le type autorise un
// retour `void` (cas non utilisé ici : nos `load` renvoient toujours un objet,
// sauf quand elles lèvent une redirection/erreur). Ce helper l'affirme au
// compilateur pour permettre l'accès direct aux propriétés dans les tests.
function sansVoid<T>(valeur: T | void): T {
  return valeur as T;
}

beforeEach(reinitialiserBase);

// --- Page d'accueil : filtrage des recettes par ingrédients ---

describe("load de la page d'accueil", () => {
  it('retourne toutes les recettes quand aucun ingrédient n’est coché', async () => {
    const resultat = sansVoid(await chargerAccueil(evenement({ url: 'http://localhost/' })));

    expect(resultat.recettes.map((r: { id: number }) => r.id)).toEqual([10, 11, 12]);
    expect(resultat.selectionIngredients).toEqual([]);
  });

  it('retourne toujours la liste complète des ingrédients pour les cases à cocher', async () => {
    const sansFiltre = sansVoid(await chargerAccueil(evenement({ url: 'http://localhost/' })));
    const avecFiltre = sansVoid(
      await chargerAccueil(evenement({ url: 'http://localhost/?ingredient=1' })),
    );

    expect(sansFiltre.ingredients).toHaveLength(3);
    expect(avecFiltre.ingredients).toHaveLength(3);
  });

  it('filtre sur un seul ingrédient', async () => {
    // Poulet (1) → « Poulet au riz » et « Poulet rôti »
    const resultat = sansVoid(
      await chargerAccueil(evenement({ url: 'http://localhost/?ingredient=1' })),
    );

    expect(resultat.recettes.map((r: { id: number }) => r.id).sort()).toEqual([10, 11]);
    expect(resultat.selectionIngredients).toEqual([1]);
  });

  it('ne garde que les recettes contenant TOUS les ingrédients cochés', async () => {
    // Poulet (1) + Riz (2) → seulement « Poulet au riz ».
    // « Poulet rôti » et « Riz sauté » n'en ont qu'un des deux : ils sont exclus.
    const resultat = sansVoid(
      await chargerAccueil(evenement({ url: 'http://localhost/?ingredient=1&ingredient=2' })),
    );

    expect(resultat.recettes.map((r: { id: number }) => r.id)).toEqual([10]);
  });

  it('retourne une liste vide quand aucune recette ne contient toute la sélection', async () => {
    // Poulet (1) + Soja (3) : aucune recette ne combine les deux.
    const resultat = sansVoid(
      await chargerAccueil(evenement({ url: 'http://localhost/?ingredient=1&ingredient=3' })),
    );

    expect(resultat.recettes).toEqual([]);
  });

  it('retourne une liste vide pour un identifiant d’ingrédient inexistant', async () => {
    const resultat = sansVoid(
      await chargerAccueil(evenement({ url: 'http://localhost/?ingredient=999' })),
    );

    expect(resultat.recettes).toEqual([]);
  });

  it('ignore les paramètres `ingredient` non numériques', async () => {
    // `Number('abc')` vaut NaN : cette valeur est filtrée, la sélection
    // effective reste donc vide et toutes les recettes sont retournées.
    const resultat = sansVoid(
      await chargerAccueil(evenement({ url: 'http://localhost/?ingredient=abc' })),
    );

    expect(resultat.selectionIngredients).toEqual([]);
    expect(resultat.recettes.map((r: { id: number }) => r.id)).toEqual([10, 11, 12]);
  });

  it('déduplique un ingrédient coché plusieurs fois dans l’URL', async () => {
    // Poulet (1) répété : la sélection ne doit compter qu'une seule fois,
    // sinon aucune recette n'atteindrait jamais le compte requis.
    const resultat = sansVoid(
      await chargerAccueil(evenement({ url: 'http://localhost/?ingredient=1&ingredient=1' })),
    );

    expect(resultat.selectionIngredients).toEqual([1]);
    expect(resultat.recettes.map((r: { id: number }) => r.id).sort()).toEqual([10, 11]);
  });
});

// --- Détail d'une recette ---

describe('load du détail d’une recette', () => {
  it('retourne la recette avec son auteur et ses ingrédients', async () => {
    const resultat = sansVoid(await chargerRecette(evenement({ params: { id: '10' } })));

    expect(resultat.recette.titre).toBe('Poulet au riz');
    expect(resultat.recette.utilisateur.nom).toBe('Alice');
    expect(
      resultat.recette.recetteIngredients.map((ri: { ingredient: { nom: string } }) => ri.ingredient.nom),
    ).toEqual([
      'Poulet',
      'Riz',
    ]);
  });

  it('lève une 404 si l’identifiant n’est pas un nombre', async () => {
    const erreur = await Promise.resolve(
      chargerRecette(evenement({ params: { id: 'abc' } })),
    ).catch((e) => e);

    expect(isHttpError(erreur)).toBe(true);
    expect(erreur.status).toBe(404);
  });

  it('lève une 404 si la recette n’existe pas', async () => {
    const erreur = await Promise.resolve(
      chargerRecette(evenement({ params: { id: '9999' } })),
    ).catch((e) => e);

    expect(isHttpError(erreur)).toBe(true);
    expect(erreur.status).toBe(404);
  });
});

// --- Mes recettes (page protégée) ---

describe('load de « mes recettes »', () => {
  it('redirige vers /connexion si l’utilisateur n’est pas connecté', async () => {
    const erreur = await Promise.resolve(chargerMesRecettes(evenement({ user: null }))).catch(
      (e) => e,
    );

    expect(isRedirect(erreur)).toBe(true);
    expect(erreur.status).toBe(303);
    expect(erreur.location).toBe('/connexion');
  });

  it('ne retourne que les recettes de l’utilisateur connecté', async () => {
    const resultat = sansVoid(await chargerMesRecettes(evenement({ user: { id: 'u1' } })));

    expect(resultat.recettes.map((r: { id: number }) => r.id)).toEqual([10, 11]);
  });

  it('retourne une liste vide pour un utilisateur sans recette', async () => {
    const resultat = sansVoid(
      await chargerMesRecettes(evenement({ user: { id: 'utilisateur-sans-recette' } })),
    );

    expect(resultat.recettes).toEqual([]);
  });
});

// --- Profil de l'utilisateur connecté ---

describe('load du profil', () => {
  it('redirige vers /connexion si l’utilisateur n’est pas connecté', async () => {
    const erreur = await Promise.resolve(chargerProfil(evenement({ user: null }))).catch(
      (e) => e,
    );

    expect(isRedirect(erreur)).toBe(true);
    expect(erreur.status).toBe(302);
    expect(erreur.location).toBe('/connexion');
  });

  it('retourne l’utilisateur et uniquement ses recettes', async () => {
    const resultat = sansVoid(
      await chargerProfil(evenement({ user: { id: 'u2', nom: 'Bob' } })),
    );

    expect(resultat.user.id).toBe('u2');
    expect(resultat.recettes.map((r: { id: number }) => r.id)).toEqual([12]);
  });
});

describe('action signOut du profil', () => {
  it('déconnecte l’utilisateur puis redirige vers /connexion', async () => {
    const evt = evenement({ headers: { cookie: 'session=abc' } });
    const erreur = await Promise.resolve(actionsProfil.signOut(evt)).catch((e) => e);

    expect(mocks.auth.api.signOut).toHaveBeenCalledTimes(1);
    expect(isRedirect(erreur)).toBe(true);
    expect(erreur.status).toBe(302);
    expect(erreur.location).toBe('/connexion');
  });

  it('transmet les en-têtes de la requête à better-auth', async () => {
    const evt = evenement({ headers: { cookie: 'session=abc' } });
    await Promise.resolve(actionsProfil.signOut(evt)).catch(() => {});

    const argument = mocks.auth.api.signOut.mock.calls[0][0] as { headers: Headers };
    expect(argument.headers.get('cookie')).toBe('session=abc');
  });
});

// --- Profil public d'un autre utilisateur ---

describe('load du profil public', () => {
  it('retourne l’utilisateur ciblé et ses recettes', async () => {
    const resultat = sansVoid(await chargerProfilPublic(evenement({ params: { id: 'u1' } })));

    expect(resultat.utilisateur.nom).toBe('Alice');
    expect(resultat.recettes.map((r: { id: number }) => r.id)).toEqual([10, 11]);
  });

  it('lève une 404 si l’utilisateur n’existe pas', async () => {
    const erreur = await Promise.resolve(
      chargerProfilPublic(evenement({ params: { id: 'inconnu' } })),
    ).catch((e) => e);

    expect(isHttpError(erreur)).toBe(true);
    expect(erreur.status).toBe(404);
  });

  it('ne fuite pas les recettes des autres utilisateurs', async () => {
    const resultat = sansVoid(await chargerProfilPublic(evenement({ params: { id: 'u2' } })));

    expect(
      resultat.recettes.every((r: { utilisateurId: string }) => r.utilisateurId === 'u2'),
    ).toBe(true);
  });
});

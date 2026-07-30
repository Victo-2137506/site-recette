// Fabriques de faux `event` SvelteKit et petits utilitaires d'assertion.
//
// Les `load` et les `actions` ne lisent qu'une poignée de propriétés de l'event
// (`url`, `params`, `locals`, `request`) : on ne construit que celles-là et on
// affirme le type avec `as never`, ce qui évite de reconstruire un
// `RequestEvent` complet.

export type FauxUtilisateur = { id: string; nom?: string; email?: string };

type OptionsEvenement = {
  url?: string;
  params?: Record<string, string>;
  user?: FauxUtilisateur | null;
  headers?: Record<string, string>;
};

// Event de lecture, pour les fonctions `load`.
export function evenement(options: OptionsEvenement = {}) {
  return {
    url: new URL(options.url ?? 'http://localhost/'),
    params: options.params ?? {},
    locals: { user: options.user ?? null, session: null },
    request: new Request('http://localhost/', { headers: options.headers ?? {} }),
  } as never;
}

// Une valeur de champ : simple, ou répétée (ingredient_id, quantite, unite).
export type ChampFormulaire = string | string[];

type OptionsFormulaire = {
  champs?: Record<string, ChampFormulaire>;
  params?: Record<string, string>;
  user?: FauxUtilisateur | null;
  headers?: Record<string, string>;
};

// Event de soumission, pour les `actions` : le `FormData` est attaché à une
// vraie `Request` POST, donc `await request.formData()` fonctionne comme en prod.
// Un tableau produit plusieurs entrées de même clé, ce qui alimente
// `formData.getAll(...)` utilisé pour les listes d'ingrédients.
export function evenementFormulaire(options: OptionsFormulaire = {}) {
  const formData = new FormData();

  for (const [cle, valeur] of Object.entries(options.champs ?? {})) {
    if (Array.isArray(valeur)) {
      for (const element of valeur) formData.append(cle, element);
    } else {
      formData.append(cle, valeur);
    }
  }

  return {
    url: new URL('http://localhost/'),
    params: options.params ?? {},
    locals: { user: options.user ?? null, session: null },
    request: new Request('http://localhost/', {
      method: 'POST',
      body: formData,
      headers: options.headers ?? {},
    }),
  } as never;
}

// Les `load` sont typées `PageServerLoad`, dont le type autorise un retour
// `void`. Nos `load` renvoient toujours un objet (sauf redirection/erreur, qui
// lèvent) : ce helper l'affirme au compilateur pour accéder aux propriétés.
export function sansVoid<T>(valeur: T | void): T {
  return valeur as T;
}

// Ce que renvoie `fail(status, données)` d'une action.
export type EchecAction = { status: number; data: Record<string, unknown> };

// Pendant de `sansVoid` pour les `actions` : leur type autorise lui aussi un
// retour `void`, ce qui empêcherait de lire `.status` et `.data` d'un `fail()`.
export function echec(valeur: unknown): EchecAction {
  return valeur as EchecAction;
}

// `error()` et `redirect()` lèvent en SvelteKit 2, y compris quand la route les
// écrit `return redirect(...)`. On capture donc la valeur levée pour l'inspecter
// avec `isHttpError` / `isRedirect`.
//
// On passe une fonction et non une promesse : certains `load` sont synchrones
// (celui de /connexion) et lèvent donc avant même qu'une promesse existe.
export async function attraper(action: () => unknown): Promise<any> {
  try {
    return await action();
  } catch (erreur) {
    return erreur;
  }
}

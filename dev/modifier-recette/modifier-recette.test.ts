// Tous les cas de `src/routes/mes-recettes/[id]/modifier/+page.server.ts` :
// l'ouverture du formulaire pré-rempli et l'enregistrement des modifications.
//
// Le formulaire est le même qu'à la création (préparations, étapes et
// ingrédients repérés par l'index de leur préparation). L'enregistrement
// supprime toutes les préparations existantes puis les recrée : leurs
// ingrédients partent avec, par cascade.

import { describe, it, expect } from 'vitest';
import { isRedirect, isHttpError } from '@sveltejs/kit';
import {
  evenement,
  evenementFormulaire,
  attraper,
  echec,
  sansVoid,
} from '../helpers/evenement';
import { base } from '../helpers/faux-db';
import {
  load,
  actions,
} from '../../src/routes/mes-recettes/[id]/modifier/+page.server';

// Les préparations d'une recette, dans l'ordre de la base.
const preparationsDe = (recetteId: number) =>
  base().preparations.filter((p) => p.recetteId === recetteId);

// Les ingrédients rattachés à une préparation donnée.
const ingredientsDe = (preparationId: number) =>
  base().recetteIngredients.filter((ri) => ri.preparationId === preparationId);

describe('load de la modification de recette', () => {
  it('redirige vers /connexion si l’utilisateur n’est pas connecté', async () => {
    const erreur = await attraper(() =>
      load(evenement({ user: null, params: { id: '10' } })),
    );

    expect(isRedirect(erreur)).toBe(true);
    expect(erreur.status).toBe(303);
    expect(erreur.location).toBe('/connexion');
  });

  it('lève une 404 si l’identifiant n’est pas un nombre', async () => {
    const erreur = await attraper(() =>
      load(evenement({ user: { id: 'u1' }, params: { id: 'abc' } })),
    );

    expect(isHttpError(erreur)).toBe(true);
    expect(erreur.status).toBe(404);
  });

  it('lève une 404 si la recette n’existe pas', async () => {
    const erreur = await attraper(() =>
      load(evenement({ user: { id: 'u1' }, params: { id: '9999' } })),
    );

    expect(isHttpError(erreur)).toBe(true);
    expect(erreur.status).toBe(404);
  });

  it('lève une 403 si la recette appartient à un autre utilisateur', async () => {
    // Alice (u1) tente d'ouvrir le formulaire de la recette 12, à Bob (u2).
    const erreur = await attraper(() =>
      load(evenement({ user: { id: 'u1' }, params: { id: '12' } })),
    );

    expect(isHttpError(erreur)).toBe(true);
    expect(erreur.status).toBe(403);
  });

  it('retourne la recette du propriétaire avec ses préparations pré-remplies', async () => {
    const resultat = sansVoid(
      await load(evenement({ user: { id: 'u1' }, params: { id: '10' } })),
    );

    expect(resultat.recette.titre).toBe('Poulet au riz');
    // Un bloc de formulaire par préparation, dans l'ordre d'affichage.
    expect(
      resultat.recette.preparations.map((p: { nom: string; ordre: number }) => [
        p.nom,
        p.ordre,
      ]),
    ).toEqual([
      ['Marinade', 0],
      ['Cuisson', 1],
    ]);
    // La liste complète sert aux menus déroulants du formulaire.
    expect(resultat.ingredients).toHaveLength(3);
  });

  it('pré-remplit les ingrédients dans la préparation à laquelle ils appartiennent', async () => {
    const resultat = sansVoid(
      await load(evenement({ user: { id: 'u1' }, params: { id: '10' } })),
    );

    const [marinade, cuisson] = resultat.recette.preparations;
    expect(
      marinade.recetteIngredients.map(
        (ri: { ingredientId: number; quantite: string; unite: string | null }) => [
          ri.ingredientId,
          ri.quantite,
          ri.unite,
        ],
      ),
    ).toEqual([[1, '200', 'g']]);
    expect(
      cuisson.recetteIngredients.map((ri: { ingredientId: number }) => ri.ingredientId),
    ).toEqual([2]);
  });
});

describe('action de modification de recette', () => {
  it('refuse la modification avec un 401 si l’utilisateur n’est pas connecté', async () => {
    const resultat = echec(
      await actions.default(
        evenementFormulaire({
          user: null,
          params: { id: '10' },
          champs: {
            titre: 'Piraté',
            preparation_nom: 'Piraté',
            etape: 'Piraté',
            etape_preparation_index: '0',
          },
        }),
      ),
    );

    expect(resultat.status).toBe(401);
    expect(resultat.data).toEqual({ message: 'Non connecté' });
    expect(base().recettes.find((r) => r.id === 10)!.titre).toBe('Poulet au riz');
  });

  it('refuse un identifiant non numérique avec un 400', async () => {
    // Le `load` répond 404 pour ce cas, mais l'action répond 400 : c'est une
    // soumission mal formée, pas une page introuvable.
    const resultat = echec(
      await actions.default(
        evenementFormulaire({
          user: { id: 'u1' },
          params: { id: 'abc' },
          champs: {
            titre: 'Tarte',
            preparation_nom: 'Pâte',
            etape: 'Cuire',
            etape_preparation_index: '0',
          },
        }),
      ),
    );

    expect(resultat.status).toBe(400);
    expect(resultat.data).toEqual({ message: 'ID de recette invalide' });
  });

  it('refuse avec un 403 la modification de la recette d’un autre utilisateur', async () => {
    // Alice (u1) soumet le formulaire de la recette 12, qui est à Bob (u2).
    const resultat = echec(
      await actions.default(
        evenementFormulaire({
          user: { id: 'u1' },
          params: { id: '12' },
          champs: {
            titre: 'Volé',
            preparation_nom: 'Volé',
            etape: 'Volé',
            etape_preparation_index: '0',
          },
        }),
      ),
    );

    expect(resultat.status).toBe(403);
    expect(resultat.data).toEqual({ message: 'Action non autorisée' });
    expect(base().recettes.find((r) => r.id === 12)!.titre).toBe('Riz sauté');
    expect(preparationsDe(12)).toHaveLength(1);
  });

  it('refuse un titre vide avec un 400, sans rien modifier', async () => {
    const resultat = echec(
      await actions.default(
        evenementFormulaire({
          user: { id: 'u1' },
          params: { id: '10' },
          champs: {
            titre: '',
            preparation_nom: 'Cuisson',
            etape: 'Cuire',
            etape_preparation_index: '0',
          },
        }),
      ),
    );

    expect(resultat.status).toBe(400);
    expect(resultat.data).toEqual({ message: 'Le titre est requis' });
    // La validation intervient avant l'écriture : rien ne doit avoir bougé.
    expect(base().recettes.find((r) => r.id === 10)!.titre).toBe('Poulet au riz');
    expect(preparationsDe(10)).toHaveLength(2);
  });

  it('refuse une préparation sans nom avec un 400, sans rien modifier', async () => {
    const resultat = echec(
      await actions.default(
        evenementFormulaire({
          user: { id: 'u1' },
          params: { id: '10' },
          champs: {
            titre: 'Poulet au riz',
            preparation_nom: ['Marinade', ''],
            etape: ['Mélanger', 'Cuire'],
            etape_preparation_index: ['0', '1'],
          },
        }),
      ),
    );

    expect(resultat.status).toBe(400);
    expect(resultat.data).toEqual({
      message: 'Chaque préparation doit avoir un nom',
    });
    expect(preparationsDe(10)).toHaveLength(2);
    expect(base().recetteIngredients).toHaveLength(5);
  });

  it('met à jour la recette, remplace ses préparations et redirige vers la fiche', async () => {
    const erreur = await attraper(() =>
      actions.default(
        evenementFormulaire({
          user: { id: 'u1' },
          params: { id: '10' },
          champs: {
            titre: 'Poulet au riz revisité',
            description: 'Version épicée',
            preparation_nom: ['Sauce', 'Cuisson'],
            etape: ['Mixer', 'Faire revenir', 'Cuire longuement'],
            etape_preparation_index: ['0', '1', '1'],
            // La recette 10 avait Poulet (1) + Riz (2) ; on passe à Riz + Soja.
            preparation_index: ['0', '1'],
            ingredient_id: ['3', '2'],
            quantite: ['1', '200'],
            unite: ['c. à s.', 'g'],
          },
        }),
      ),
    );

    expect(base().recettes.find((r) => r.id === 10)).toMatchObject({
      titre: 'Poulet au riz revisité',
      description: 'Version épicée',
      utilisateurId: 'u1',
    });

    // Les anciennes préparations (« Marinade », « Cuisson ») sont supprimées
    // puis recréées à partir du formulaire, avec de nouveaux identifiants.
    const [sauce, cuisson] = preparationsDe(10);
    expect(sauce).toMatchObject({ nom: 'Sauce', ordre: 0, etapes: '1. Mixer' });
    expect(cuisson).toMatchObject({
      nom: 'Cuisson',
      ordre: 1,
      etapes: '1. Faire revenir\n2. Cuire longuement',
    });
    expect(base().preparations.some((p) => p.id === 100 || p.id === 101)).toBe(false);

    expect(ingredientsDe(sauce.id)).toEqual([
      { preparationId: sauce.id, ingredientId: 3, quantite: '1', unite: 'c. à s.' },
    ]);
    expect(ingredientsDe(cuisson.id)).toEqual([
      { preparationId: cuisson.id, ingredientId: 2, quantite: '200', unite: 'g' },
    ]);

    // Les autres recettes ne sont pas touchées.
    expect(preparationsDe(12)).toHaveLength(1);
    expect(ingredientsDe(103)).toHaveLength(2);

    expect(isRedirect(erreur)).toBe(true);
    expect(erreur.status).toBe(303);
    expect(erreur.location).toBe('/recettes/10');
  });

  it('supprime les ingrédients des anciennes préparations, par cascade', async () => {
    // La route ne supprime que les préparations : les associations qui les
    // accompagnaient ne doivent laisser aucun orphelin derrière elles.
    await attraper(() =>
      actions.default(
        evenementFormulaire({
          user: { id: 'u1' },
          params: { id: '10' },
          champs: {
            titre: 'Poulet au riz',
            preparation_nom: 'Tout en un',
            etape: 'Tout cuire ensemble',
            etape_preparation_index: '0',
          },
        }),
      ),
    );

    // Deux préparations remplacées par une seule, sans ingrédient.
    expect(preparationsDe(10)).toHaveLength(1);
    expect(ingredientsDe(100)).toEqual([]);
    expect(ingredientsDe(101)).toEqual([]);
    // Restent les trois associations des recettes 11 et 12.
    expect(base().recetteIngredients).toHaveLength(3);
  });

  it('laisse une préparation sans ingrédient si le formulaire n’en envoie plus', async () => {
    const erreur = await attraper(() =>
      actions.default(
        evenementFormulaire({
          user: { id: 'u1' },
          params: { id: '10' },
          champs: {
            titre: 'Riz nature',
            preparation_nom: 'Cuisson',
            etape: 'Cuire le riz',
            etape_preparation_index: '0',
          },
        }),
      ),
    );

    expect(base().recettes.find((r) => r.id === 10)!.titre).toBe('Riz nature');
    expect(ingredientsDe(preparationsDe(10)[0].id)).toEqual([]);
    expect(isRedirect(erreur)).toBe(true);
    expect(erreur.location).toBe('/recettes/10');
  });

  it('conserve les j’aime reçus par la recette modifiée', async () => {
    // La modification touche la recette et ses préparations, jamais les likes.
    await attraper(() =>
      actions.default(
        evenementFormulaire({
          user: { id: 'u1' },
          params: { id: '10' },
          champs: {
            titre: 'Poulet au riz v2',
            preparation_nom: 'Cuisson',
            etape: 'Cuire',
            etape_preparation_index: '0',
          },
        }),
      ),
    );

    expect(base().jaime.filter((j) => j.recetteId === 10)).toHaveLength(2);
  });

  it('conserve la recette d’origine quand une préparation est refusée', async () => {
    // Le cas le plus dangereux : la mise à jour commence par supprimer les
    // préparations existantes. La validation ayant lieu avant toute écriture,
    // une étape manquante doit laisser la recette exactement dans son état.
    const resultat = echec(
      await actions.default(
        evenementFormulaire({
          user: { id: 'u1' },
          params: { id: '10' },
          champs: {
            titre: 'Poulet au riz',
            preparation_nom: ['Marinade', 'Cuisson'],
            etape: 'Mélanger',
            etape_preparation_index: '0',
          },
        }),
      ),
    );

    expect(resultat.status).toBe(400);
    expect(resultat.data).toEqual({
      message: 'La préparation "Cuisson" doit avoir au moins une étape',
    });
    // Les deux préparations d'origine et leurs ingrédients sont toujours là.
    expect(preparationsDe(10).map((p) => p.id)).toEqual([100, 101]);
    expect(ingredientsDe(100)).toHaveLength(1);
    expect(ingredientsDe(101)).toHaveLength(1);
  });
});

// Tous les cas de `src/routes/mes-recettes/creer/+page.server.ts` : le
// formulaire de création et l'insertion de la recette.
//
// Le formulaire envoie un champ `etape` par bloc d'étape ; la route les
// renumérote en un seul texte (« 1. ... \n 2. ... ») avant de l'enregistrer.

import { describe, it, expect } from 'vitest';
import { isRedirect } from '@sveltejs/kit';
import {
  evenement,
  evenementFormulaire,
  attraper,
  echec,
  sansVoid,
} from '../helpers/evenement';
import { base } from '../helpers/faux-db';
import { load, actions } from '../../src/routes/mes-recettes/creer/+page.server';

describe('load de la création de recette', () => {
  it('redirige vers /connexion si l’utilisateur n’est pas connecté', async () => {
    const erreur = await attraper(() => load(evenement({ user: null })));

    expect(isRedirect(erreur)).toBe(true);
    expect(erreur.status).toBe(303);
    expect(erreur.location).toBe('/connexion');
  });

  it('fournit tous les ingrédients disponibles pour le formulaire', async () => {
    const resultat = sansVoid(await load(evenement({ user: { id: 'u1' } })));

    expect(resultat.ingredients.map((i: { nom: string }) => i.nom)).toEqual([
      'Poulet',
      'Riz',
      'Soja',
    ]);
  });
});

describe('action de création de recette', () => {
  it('refuse la création avec un 401 si l’utilisateur n’est pas connecté', async () => {
    const resultat = echec(
      await actions.default(
        evenementFormulaire({
          user: null,
          champs: { titre: 'Tarte', etape: 'Cuire', ingredient_id: '1', quantite: '1' },
        }),
      ),
    );

    expect(resultat.status).toBe(401);
    expect(resultat.data).toEqual({ message: 'Non connecté' });
    expect(base().recettes).toHaveLength(3);
  });

  it('refuse un titre vide avec un 400', async () => {
    const resultat = echec(
      await actions.default(
        evenementFormulaire({
          user: { id: 'u1' },
          champs: { titre: '', etape: 'Cuire', ingredient_id: '1', quantite: '1' },
        }),
      ),
    );

    expect(resultat.status).toBe(400);
    expect(resultat.data).toEqual({
      message: 'Le titre et au moins une étape sont requis',
    });
    expect(base().recettes).toHaveLength(3);
  });

  it('refuse une recette sans aucune étape avec un 400', async () => {
    // Les blocs vides ou faits d'espaces sont écartés : il ne reste rien.
    const resultat = echec(
      await actions.default(
        evenementFormulaire({
          user: { id: 'u1' },
          champs: {
            titre: 'Tarte',
            etape: ['', '   '],
            ingredient_id: '1',
            quantite: '1',
          },
        }),
      ),
    );

    expect(resultat.status).toBe(400);
    expect(resultat.data).toEqual({
      message: 'Le titre et au moins une étape sont requis',
    });
    expect(base().recettes).toHaveLength(3);
  });

  it('refuse une recette sans aucun ingrédient avec un 400', async () => {
    const resultat = echec(
      await actions.default(
        evenementFormulaire({
          user: { id: 'u1' },
          champs: { titre: 'Eau chaude', etape: 'Faire bouillir' },
        }),
      ),
    );

    expect(resultat.status).toBe(400);
    expect(resultat.data).toEqual({ message: 'Sélectionne au moins un ingrédient' });
    expect(base().recettes).toHaveLength(3);
  });

  it('insère la recette et ses ingrédients, puis redirige vers la fiche', async () => {
    const erreur = await attraper(() =>
      actions.default(
        evenementFormulaire({
          user: { id: 'u1' },
          champs: {
            titre: 'Poulet au soja',
            description: 'Rapide',
            etape: ['Mariner', 'Cuire'],
            // Les trois listes sont parallèles : même index = même ingrédient.
            ingredient_id: ['1', '3'],
            quantite: ['300', '2'],
            unite: ['g', 'c. à s.'],
          },
        }),
      ),
    );

    // Nouvelle recette, avec l'id auto-incrémenté après la 12.
    const creee = base().recettes.at(-1)!;
    expect(creee).toMatchObject({
      id: 13,
      titre: 'Poulet au soja',
      description: 'Rapide',
      // Les blocs d'étapes sont concaténés et numérotés.
      etapes: '1. Mariner\n2. Cuire',
      utilisateurId: 'u1',
    });

    // Les associations ingrédient/quantité/unité pointent bien vers cette recette.
    expect(base().recetteIngredients.filter((ri) => ri.recetteId === 13)).toEqual([
      { recetteId: 13, ingredientId: 1, quantite: '300', unite: 'g' },
      { recetteId: 13, ingredientId: 3, quantite: '2', unite: 'c. à s.' },
    ]);

    expect(isRedirect(erreur)).toBe(true);
    expect(erreur.status).toBe(303);
    expect(erreur.location).toBe('/recettes/13');
  });

  it('renumérote les étapes en ignorant les blocs vides', async () => {
    // Un bloc laissé vide au milieu du formulaire ne doit pas créer de trou
    // dans la numérotation enregistrée.
    await attraper(() =>
      actions.default(
        evenementFormulaire({
          user: { id: 'u1' },
          champs: {
            titre: 'Salade',
            etape: ['  Laver  ', '', 'Couper', '   '],
            ingredient_id: '1',
            quantite: '1',
          },
        }),
      ),
    );

    expect(base().recettes.at(-1)!.etapes).toBe('1. Laver\n2. Couper');
  });

  it('enregistre `null` quand l’unité est vide ou faite d’espaces', async () => {
    // La colonne `unite` est nullable : une chaîne vide serait un faux
    // « il y a une unité », d'où le passage explicite à null.
    await attraper(() =>
      actions.default(
        evenementFormulaire({
          user: { id: 'u1' },
          champs: {
            titre: 'Salade',
            etape: 'Mélanger',
            ingredient_id: ['1', '2'],
            quantite: ['1', '  2  '],
            unite: ['', '   '],
          },
        }),
      ),
    );

    expect(base().recetteIngredients.filter((ri) => ri.recetteId === 13)).toEqual([
      { recetteId: 13, ingredientId: 1, quantite: '1', unite: null },
      // La quantité est également nettoyée de ses espaces.
      { recetteId: 13, ingredientId: 2, quantite: '2', unite: null },
    ]);
  });
});

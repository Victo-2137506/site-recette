// Tous les cas de `src/routes/mes-recettes/creer/+page.server.ts` : le
// formulaire de création et l'insertion de la recette.
//
// Le formulaire est découpé en préparations. Chaque champ répété porte l'index
// de la préparation à laquelle il appartient :
//
//   preparation_nom            un par préparation, dans l'ordre d'affichage
//   etape / etape_preparation_index    une étape et sa préparation d'origine
//   ingredient_id / quantite / unite / preparation_index   idem pour une ligne
//                                                          d'ingrédient
//
// La route renumérote les étapes de chaque préparation en un seul texte
// (« 1. ... \n 2. ... ») avant de l'enregistrer.

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

// Les préparations de la recette qui vient d'être créée, dans l'ordre.
const preparationsDe = (recetteId: number) =>
  base().preparations.filter((p) => p.recetteId === recetteId);

// Les ingrédients rattachés à une préparation donnée.
const ingredientsDe = (preparationId: number) =>
  base().recetteIngredients.filter((ri) => ri.preparationId === preparationId);

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
          champs: {
            titre: 'Tarte',
            preparation_nom: 'Pâte',
            etape: 'Cuire',
            etape_preparation_index: '0',
          },
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
          champs: {
            titre: '',
            preparation_nom: 'Pâte',
            etape: 'Cuire',
            etape_preparation_index: '0',
          },
        }),
      ),
    );

    expect(resultat.status).toBe(400);
    expect(resultat.data).toEqual({ message: 'Le titre est requis' });
    expect(base().recettes).toHaveLength(3);
  });

  it('refuse une recette sans aucune préparation avec un 400', async () => {
    const resultat = echec(
      await actions.default(
        evenementFormulaire({
          user: { id: 'u1' },
          champs: { titre: 'Eau chaude', etape: 'Faire bouillir' },
        }),
      ),
    );

    expect(resultat.status).toBe(400);
    expect(resultat.data).toEqual({
      message: 'Chaque préparation doit avoir un nom',
    });
    expect(base().recettes).toHaveLength(3);
  });

  it('refuse une préparation dont le nom est vide ou fait d’espaces', async () => {
    // La première a un nom, pas la seconde : la recette entière est refusée.
    const resultat = echec(
      await actions.default(
        evenementFormulaire({
          user: { id: 'u1' },
          champs: {
            titre: 'Tarte',
            preparation_nom: ['Pâte', '   '],
            etape: ['Mélanger', 'Étaler'],
            etape_preparation_index: ['0', '1'],
          },
        }),
      ),
    );

    expect(resultat.status).toBe(400);
    expect(resultat.data).toEqual({
      message: 'Chaque préparation doit avoir un nom',
    });
    expect(base().recettes).toHaveLength(3);
    expect(base().preparations).toHaveLength(4);
  });

  it('refuse une préparation sans aucune étape, en la nommant dans le message', async () => {
    // Les blocs vides ou faits d'espaces sont écartés : la « Garniture »
    // se retrouve sans étape.
    const resultat = echec(
      await actions.default(
        evenementFormulaire({
          user: { id: 'u1' },
          champs: {
            titre: 'Tarte',
            preparation_nom: ['Pâte', 'Garniture'],
            etape: ['Mélanger', '   '],
            etape_preparation_index: ['0', '1'],
          },
        }),
      ),
    );

    expect(resultat.status).toBe(400);
    expect(resultat.data).toEqual({
      message: 'La préparation "Garniture" doit avoir au moins une étape',
    });
  });

  it('insère la recette, ses préparations et leurs ingrédients, puis redirige vers la fiche', async () => {
    const erreur = await attraper(() =>
      actions.default(
        evenementFormulaire({
          user: { id: 'u1' },
          champs: {
            titre: 'Tarte aux pommes',
            description: 'Classique',
            preparation_nom: ['Pâte', 'Garniture'],
            // Deux étapes pour la pâte (index 0), une pour la garniture (index 1).
            etape: ['Mélanger la farine', 'Étaler', 'Couper les pommes'],
            etape_preparation_index: ['0', '0', '1'],
            // Les quatre listes sont parallèles : même index = même ligne.
            preparation_index: ['0', '1', '1'],
            ingredient_id: ['1', '2', '3'],
            quantite: ['200', '150', '2'],
            unite: ['g', 'g', ''],
          },
        }),
      ),
    );

    // Nouvelle recette, avec l'id auto-incrémenté après la 12.
    const creee = base().recettes.at(-1)!;
    expect(creee).toMatchObject({
      id: 13,
      titre: 'Tarte aux pommes',
      description: 'Classique',
      utilisateurId: 'u1',
    });

    // Deux préparations, numérotées dans l'ordre du formulaire, chacune avec
    // ses étapes renumérotées.
    const [pate, garniture] = preparationsDe(13);
    expect(pate).toMatchObject({
      nom: 'Pâte',
      ordre: 0,
      etapes: '1. Mélanger la farine\n2. Étaler',
    });
    expect(garniture).toMatchObject({
      nom: 'Garniture',
      ordre: 1,
      etapes: '1. Couper les pommes',
    });

    // Chaque ingrédient est rattaché à sa préparation, pas à la recette.
    expect(ingredientsDe(pate.id)).toEqual([
      { preparationId: pate.id, ingredientId: 1, quantite: '200', unite: 'g' },
    ]);
    expect(ingredientsDe(garniture.id)).toEqual([
      { preparationId: garniture.id, ingredientId: 2, quantite: '150', unite: 'g' },
      { preparationId: garniture.id, ingredientId: 3, quantite: '2', unite: null },
    ]);

    expect(isRedirect(erreur)).toBe(true);
    expect(erreur.status).toBe(303);
    expect(erreur.location).toBe('/recettes/13');
  });

  it('renumérote les étapes de chaque préparation en ignorant les blocs vides', async () => {
    // Un bloc laissé vide au milieu du formulaire ne doit pas créer de trou
    // dans la numérotation, et la numérotation repart à 1 à chaque préparation.
    await attraper(() =>
      actions.default(
        evenementFormulaire({
          user: { id: 'u1' },
          champs: {
            titre: 'Salade composée',
            preparation_nom: ['Légumes', 'Sauce'],
            etape: ['  Laver  ', '', 'Couper', 'Mélanger', '   '],
            etape_preparation_index: ['0', '0', '0', '1', '1'],
          },
        }),
      ),
    );

    expect(preparationsDe(13).map((p) => p.etapes)).toEqual([
      '1. Laver\n2. Couper',
      '1. Mélanger',
    ]);
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
            preparation_nom: 'Salade',
            etape: 'Mélanger',
            etape_preparation_index: '0',
            preparation_index: ['0', '0'],
            ingredient_id: ['1', '2'],
            quantite: ['1', '  2  '],
            unite: ['', '   '],
          },
        }),
      ),
    );

    const [salade] = preparationsDe(13);
    expect(ingredientsDe(salade.id)).toEqual([
      { preparationId: salade.id, ingredientId: 1, quantite: '1', unite: null },
      // La quantité est également nettoyée de ses espaces.
      { preparationId: salade.id, ingredientId: 2, quantite: '2', unite: null },
    ]);
  });

  it('accepte une préparation sans aucun ingrédient', async () => {
    // Rien n'oblige à cocher un ingrédient : une préparation peut n'être
    // qu'une suite d'étapes (« Préchauffer le four »).
    const erreur = await attraper(() =>
      actions.default(
        evenementFormulaire({
          user: { id: 'u1' },
          champs: {
            titre: 'Eau chaude',
            preparation_nom: 'Cuisson',
            etape: 'Faire bouillir',
            etape_preparation_index: '0',
          },
        }),
      ),
    );

    const [cuisson] = preparationsDe(13);
    expect(cuisson.etapes).toBe('1. Faire bouillir');
    expect(ingredientsDe(cuisson.id)).toEqual([]);
    expect(isRedirect(erreur)).toBe(true);
    expect(erreur.location).toBe('/recettes/13');
  });

  it('n’enregistre rien du tout quand une préparation est refusée', async () => {
    // Toutes les préparations sont validées avant la première écriture : une
    // étape manquante sur la seconde ne doit laisser ni recette incomplète ni
    // préparation orpheline derrière elle.
    const resultat = echec(
      await actions.default(
        evenementFormulaire({
          user: { id: 'u1' },
          champs: {
            titre: 'Tarte inachevée',
            preparation_nom: ['Pâte', 'Garniture'],
            etape: 'Mélanger',
            etape_preparation_index: '0',
          },
        }),
      ),
    );

    expect(resultat.status).toBe(400);
    expect(resultat.data).toEqual({
      message: 'La préparation "Garniture" doit avoir au moins une étape',
    });
    expect(base().recettes).toHaveLength(3);
    expect(base().preparations).toHaveLength(4);
  });
});

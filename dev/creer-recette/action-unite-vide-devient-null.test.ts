import { describe, it, expect } from 'vitest';
import { evenementFormulaire, attraper } from '../helpers/evenement';
import { base } from '../helpers/faux-db';
import { actions } from '../../src/routes/mes-recettes/creer/+page.server';

describe('action de création de recette', () => {
  it('enregistre `null` quand l’unité est vide ou faite d’espaces', async () => {
    // La colonne `unite` est nullable : une chaîne vide serait un faux
    // « il y a une unité », d'où le passage explicite à null.
    await attraper(() =>
      actions.default(
        evenementFormulaire({
          user: { id: 'u1' },
          champs: {
            titre: 'Salade',
            etapes: 'Mélanger',
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

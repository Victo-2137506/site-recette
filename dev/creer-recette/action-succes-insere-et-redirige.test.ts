import { describe, it, expect } from 'vitest';
import { isRedirect } from '@sveltejs/kit';
import { evenementFormulaire, attraper } from '../helpers/evenement';
import { base } from '../helpers/faux-db';
import { actions } from '../../src/routes/mes-recettes/creer/+page.server';

describe('action de création de recette', () => {
  it('insère la recette et ses ingrédients, puis redirige vers la fiche', async () => {
    const erreur = await attraper(() =>
      actions.default(
        evenementFormulaire({
          user: { id: 'u1' },
          champs: {
            titre: 'Poulet au soja',
            description: 'Rapide',
            etapes: 'Mariner puis cuire',
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
      etapes: 'Mariner puis cuire',
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
});

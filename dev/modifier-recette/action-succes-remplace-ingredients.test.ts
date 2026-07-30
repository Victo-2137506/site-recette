import { describe, it, expect } from 'vitest';
import { isRedirect } from '@sveltejs/kit';
import { evenementFormulaire, attraper } from '../helpers/evenement';
import { base } from '../helpers/faux-db';
import { actions } from '../../src/routes/mes-recettes/[id]/modifier/+page.server';

describe('action de modification de recette', () => {
  it('met à jour la recette, remplace ses ingrédients et redirige vers la fiche', async () => {
    const erreur = await attraper(() =>
      actions.default(
        evenementFormulaire({
          user: { id: 'u1' },
          params: { id: '10' },
          champs: {
            titre: 'Poulet au riz revisité',
            description: 'Version épicée',
            etapes: 'Cuire longuement',
            // La recette 10 avait Poulet (1) + Riz (2) ; on passe à Riz + Soja.
            ingredient_id: ['2', '3'],
            quantite: ['200', '1'],
            unite: ['g', 'c. à s.'],
          },
        }),
      ),
    );

    expect(base().recettes.find((r) => r.id === 10)).toMatchObject({
      titre: 'Poulet au riz revisité',
      description: 'Version épicée',
      etapes: 'Cuire longuement',
      utilisateurId: 'u1',
    });

    // Les anciennes associations sont supprimées, pas seulement complétées.
    expect(base().recetteIngredients.filter((ri) => ri.recetteId === 10)).toEqual([
      { recetteId: 10, ingredientId: 2, quantite: '200', unite: 'g' },
      { recetteId: 10, ingredientId: 3, quantite: '1', unite: 'c. à s.' },
    ]);

    // Les autres recettes ne sont pas touchées.
    expect(base().recetteIngredients.filter((ri) => ri.recetteId === 12)).toHaveLength(2);

    expect(isRedirect(erreur)).toBe(true);
    expect(erreur.status).toBe(303);
    expect(erreur.location).toBe('/recettes/10');
  });
});

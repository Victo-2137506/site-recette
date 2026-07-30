import { describe, it, expect } from 'vitest';
import { evenement, sansVoid } from '../helpers/evenement';
import { load } from '../../src/routes/mes-recettes/[id]/modifier/+page.server';

describe('load de la modification de recette', () => {
  it('retourne la recette du propriétaire avec ses associations et la liste des ingrédients', async () => {
    const resultat = sansVoid(
      await load(evenement({ user: { id: 'u1' }, params: { id: '10' } })),
    );

    expect(resultat.recette.titre).toBe('Poulet au riz');
    // Les associations pré-remplissent le formulaire (ingrédient, quantité, unité).
    expect(
      resultat.recette.recetteIngredients.map(
        (ri: { ingredientId: number }) => ri.ingredientId,
      ),
    ).toEqual([1, 2]);
    // La liste complète sert aux menus déroulants du formulaire.
    expect(resultat.ingredients).toHaveLength(3);
  });
});

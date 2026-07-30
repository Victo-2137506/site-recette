import { describe, it, expect } from 'vitest';
import { evenement, sansVoid } from '../helpers/evenement';
import { load } from '../../src/routes/recettes/[id]/+page.server';

describe('load du détail d’une recette', () => {
  it('retourne la recette avec son auteur et ses ingrédients', async () => {
    const resultat = sansVoid(await load(evenement({ params: { id: '10' } })));

    expect(resultat.recette.titre).toBe('Poulet au riz');
    expect(resultat.recette.utilisateur.nom).toBe('Alice');
    expect(
      resultat.recette.recetteIngredients.map(
        (ri: { ingredient: { nom: string } }) => ri.ingredient.nom,
      ),
    ).toEqual(['Poulet', 'Riz']);
  });
});

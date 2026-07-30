import { describe, it, expect } from 'vitest';
import { evenement, sansVoid } from '../helpers/evenement';
import { load } from '../../src/routes/+page.server';

describe("load de la page d'accueil", () => {
  it('filtre sur un seul ingrédient', async () => {
    // Poulet (1) → « Poulet au riz » (10) et « Poulet rôti » (11)
    const resultat = sansVoid(
      await load(evenement({ url: 'http://localhost/?ingredient=1' })),
    );

    expect(resultat.recettes.map((r: { id: number }) => r.id).sort()).toEqual([10, 11]);
    expect(resultat.selectionIngredients).toEqual([1]);
  });
});

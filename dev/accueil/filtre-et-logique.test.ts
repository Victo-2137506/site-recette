import { describe, it, expect } from 'vitest';
import { evenement, sansVoid } from '../helpers/evenement';
import { load } from '../../src/routes/+page.server';

describe("load de la page d'accueil", () => {
  it('ne garde que les recettes contenant TOUS les ingrédients cochés', async () => {
    // Poulet (1) + Riz (2) → seulement « Poulet au riz » (10).
    // « Poulet rôti » et « Riz sauté » n'en ont qu'un des deux : ils sont exclus.
    const resultat = sansVoid(
      await load(evenement({ url: 'http://localhost/?ingredient=1&ingredient=2' })),
    );

    expect(resultat.recettes.map((r: { id: number }) => r.id)).toEqual([10]);
  });
});

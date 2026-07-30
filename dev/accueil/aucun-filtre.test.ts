import { describe, it, expect } from 'vitest';
import { evenement, sansVoid } from '../helpers/evenement';
import { load } from '../../src/routes/+page.server';

describe("load de la page d'accueil", () => {
  it('retourne toutes les recettes quand aucun ingrédient n’est coché', async () => {
    const resultat = sansVoid(await load(evenement({ url: 'http://localhost/' })));

    expect(resultat.recettes.map((r: { id: number }) => r.id)).toEqual([10, 11, 12]);
    expect(resultat.selectionIngredients).toEqual([]);
  });
});

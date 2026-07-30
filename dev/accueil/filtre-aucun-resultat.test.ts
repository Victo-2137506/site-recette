import { describe, it, expect } from 'vitest';
import { evenement, sansVoid } from '../helpers/evenement';
import { load } from '../../src/routes/+page.server';

describe("load de la page d'accueil", () => {
  it('retourne une liste vide quand aucune recette ne contient toute la sélection', async () => {
    // Poulet (1) + Soja (3) : aucune recette ne combine les deux.
    const resultat = sansVoid(
      await load(evenement({ url: 'http://localhost/?ingredient=1&ingredient=3' })),
    );

    expect(resultat.recettes).toEqual([]);
  });
});

import { describe, it, expect } from 'vitest';
import { evenement, sansVoid } from '../helpers/evenement';
import { load } from '../../src/routes/+page.server';

describe("load de la page d'accueil", () => {
  it('retourne une liste vide pour un identifiant d’ingrédient inexistant', async () => {
    const resultat = sansVoid(
      await load(evenement({ url: 'http://localhost/?ingredient=999' })),
    );

    expect(resultat.recettes).toEqual([]);
  });
});

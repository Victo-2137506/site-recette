import { describe, it, expect } from 'vitest';
import { evenement, sansVoid } from '../helpers/evenement';
import { load } from '../../src/routes/+page.server';

describe("load de la page d'accueil", () => {
  it('ignore les paramètres `ingredient` non numériques', async () => {
    // `Number('abc')` vaut NaN : cette valeur est filtrée par `Number.isFinite`,
    // la sélection effective reste vide et toutes les recettes sont retournées.
    const resultat = sansVoid(
      await load(evenement({ url: 'http://localhost/?ingredient=abc' })),
    );

    expect(resultat.selectionIngredients).toEqual([]);
    expect(resultat.recettes.map((r: { id: number }) => r.id)).toEqual([10, 11, 12]);
  });
});

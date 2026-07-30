import { describe, it, expect } from 'vitest';
import { evenement, sansVoid } from '../helpers/evenement';
import { load } from '../../src/routes/mes-recettes/creer/+page.server';

describe('load de la création de recette', () => {
  it('fournit tous les ingrédients disponibles pour le formulaire', async () => {
    const resultat = sansVoid(await load(evenement({ user: { id: 'u1' } })));

    expect(resultat.ingredients.map((i: { nom: string }) => i.nom)).toEqual([
      'Poulet',
      'Riz',
      'Soja',
    ]);
  });
});

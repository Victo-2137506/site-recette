import { describe, it, expect } from 'vitest';
import { evenement, sansVoid } from '../helpers/evenement';
import { load } from '../../src/routes/mes-recettes/+page.server';

describe('load de « mes recettes »', () => {
  it('retourne une liste vide pour un utilisateur sans recette', async () => {
    const resultat = sansVoid(
      await load(evenement({ user: { id: 'utilisateur-sans-recette' } })),
    );

    expect(resultat.recettes).toEqual([]);
  });
});

import { describe, it, expect } from 'vitest';
import { evenement, sansVoid } from '../helpers/evenement';
import { load } from '../../src/routes/mes-recettes/+page.server';

describe('load de « mes recettes »', () => {
  it('ne retourne que les recettes de l’utilisateur connecté', async () => {
    // Alice (u1) possède 10 et 11 ; la recette 12 appartient à Bob.
    const resultat = sansVoid(await load(evenement({ user: { id: 'u1' } })));

    expect(resultat.recettes.map((r: { id: number }) => r.id)).toEqual([10, 11]);
  });
});

import { describe, it, expect } from 'vitest';
import { evenement, sansVoid } from '../helpers/evenement';
import { load } from '../../src/routes/profil/[id]/+page.server';

describe('load du profil public', () => {
  it('retourne l’utilisateur ciblé et ses recettes', async () => {
    const resultat = sansVoid(await load(evenement({ params: { id: 'u1' } })));

    expect(resultat.utilisateur.nom).toBe('Alice');
    expect(resultat.recettes.map((r: { id: number }) => r.id)).toEqual([10, 11]);
  });
});

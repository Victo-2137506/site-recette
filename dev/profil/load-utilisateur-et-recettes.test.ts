import { describe, it, expect } from 'vitest';
import { evenement, sansVoid } from '../helpers/evenement';
import { load } from '../../src/routes/profil/+page.server';

describe('load du profil', () => {
  it('retourne l’utilisateur connecté et uniquement ses recettes', async () => {
    const resultat = sansVoid(await load(evenement({ user: { id: 'u2', nom: 'Bob' } })));

    expect(resultat.user.id).toBe('u2');
    expect(resultat.recettes.map((r: { id: number }) => r.id)).toEqual([12]);
  });
});

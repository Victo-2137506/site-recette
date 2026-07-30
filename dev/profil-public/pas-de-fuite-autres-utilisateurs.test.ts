import { describe, it, expect } from 'vitest';
import { evenement, sansVoid } from '../helpers/evenement';
import { load } from '../../src/routes/profil/[id]/+page.server';

describe('load du profil public', () => {
  it('ne fuite pas les recettes des autres utilisateurs', async () => {
    const resultat = sansVoid(await load(evenement({ params: { id: 'u2' } })));

    expect(
      resultat.recettes.every((r: { utilisateurId: string }) => r.utilisateurId === 'u2'),
    ).toBe(true);
  });
});

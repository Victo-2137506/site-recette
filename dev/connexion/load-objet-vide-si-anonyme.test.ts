import { describe, it, expect } from 'vitest';
import { evenement, sansVoid } from '../helpers/evenement';
import { load } from '../../src/routes/connexion/+page.server';

describe('load de la page de connexion', () => {
  it('laisse passer un visiteur anonyme', async () => {
    // Aucune redirection : le formulaire de connexion doit s'afficher.
    const resultat = sansVoid(await load(evenement({ user: null })));

    expect(resultat).toEqual({});
  });
});

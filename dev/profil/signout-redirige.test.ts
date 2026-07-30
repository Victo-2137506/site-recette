import { describe, it, expect } from 'vitest';
import { isRedirect } from '@sveltejs/kit';
import { evenement, attraper } from '../helpers/evenement';
import { mocks } from '../helpers/mocks';
import { actions } from '../../src/routes/profil/+page.server';

describe('action signOut du profil', () => {
  it('déconnecte l’utilisateur puis redirige vers /connexion', async () => {
    const erreur = await attraper(() =>
      actions.signOut(evenement({ headers: { cookie: 'session=abc' } })),
    );

    expect(mocks.auth.api.signOut).toHaveBeenCalledTimes(1);
    expect(isRedirect(erreur)).toBe(true);
    expect(erreur.status).toBe(302);
    expect(erreur.location).toBe('/connexion');
  });
});

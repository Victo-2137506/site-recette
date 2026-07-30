import { describe, it, expect } from 'vitest';
import { isRedirect } from '@sveltejs/kit';
import { evenementFormulaire, attraper } from '../helpers/evenement';
import { mocks } from '../helpers/mocks';
import { actions } from '../../src/routes/connexion/+page.server';

describe('action signUpEmail', () => {
  it('inscrit l’utilisateur puis redirige vers /profil', async () => {
    const erreur = await attraper(() =>
      actions.signUpEmail(
        evenementFormulaire({
          champs: { email: 'carole@test.fr', password: 'motdepasse', name: 'Carole' },
        }),
      ),
    );

    expect(mocks.auth.api.signUpEmail).toHaveBeenCalledTimes(1);
    // Le nom est propre à l'inscription : il doit être transmis lui aussi.
    expect(mocks.auth.api.signUpEmail.mock.calls[0][0]).toMatchObject({
      body: { email: 'carole@test.fr', password: 'motdepasse', name: 'Carole' },
    });
    expect(isRedirect(erreur)).toBe(true);
    expect(erreur.status).toBe(302);
    expect(erreur.location).toBe('/profil');
  });
});

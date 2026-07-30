import { describe, it, expect } from 'vitest';
import { isRedirect } from '@sveltejs/kit';
import { evenementFormulaire, attraper } from '../helpers/evenement';
import { mocks } from '../helpers/mocks';
import { actions } from '../../src/routes/connexion/+page.server';

describe('action signInEmail', () => {
  it('connecte l’utilisateur puis redirige vers /profil', async () => {
    const erreur = await attraper(() =>
      actions.signInEmail(
        evenementFormulaire({
          champs: { email: 'alice@test.fr', password: 'motdepasse' },
        }),
      ),
    );

    expect(mocks.auth.api.signInEmail).toHaveBeenCalledTimes(1);
    // Les identifiants du formulaire sont bien transmis à better-auth.
    expect(mocks.auth.api.signInEmail.mock.calls[0][0]).toMatchObject({
      body: { email: 'alice@test.fr', password: 'motdepasse' },
    });
    expect(isRedirect(erreur)).toBe(true);
    expect(erreur.status).toBe(302);
    expect(erreur.location).toBe('/profil');
  });
});

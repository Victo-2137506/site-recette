import { describe, it, expect, vi } from 'vitest';
import { APIError } from 'better-auth/api';
import { evenementFormulaire, echec } from '../helpers/evenement';
import { mocks } from '../helpers/mocks';
import { actions } from '../../src/routes/connexion/+page.server';

describe('action signUpEmail', () => {
  it('renvoie un 400 avec le message de better-auth quand l’email est déjà pris', async () => {
    mocks.auth.api.signUpEmail = vi.fn(async () => {
      throw new APIError('BAD_REQUEST', { message: 'Cet email est déjà utilisé' });
    });

    const resultat = echec(
      await actions.signUpEmail(
        evenementFormulaire({
          champs: { email: 'alice@test.fr', password: 'motdepasse', name: 'Alice' },
        }),
      ),
    );

    expect(resultat.status).toBe(400);
    expect(resultat.data).toEqual({ message: 'Cet email est déjà utilisé' });
  });
});

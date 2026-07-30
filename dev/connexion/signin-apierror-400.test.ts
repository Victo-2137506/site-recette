import { describe, it, expect, vi } from 'vitest';
import { APIError } from 'better-auth/api';
import { evenementFormulaire, echec } from '../helpers/evenement';
import { mocks } from '../helpers/mocks';
import { actions } from '../../src/routes/connexion/+page.server';

describe('action signInEmail', () => {
  it('renvoie un 400 avec le message de better-auth quand les identifiants sont refusés', async () => {
    mocks.auth.api.signInEmail = vi.fn(async () => {
      throw new APIError('UNAUTHORIZED', { message: 'Identifiants invalides' });
    });

    const resultat = echec(
      await actions.signInEmail(
        evenementFormulaire({ champs: { email: 'alice@test.fr', password: 'faux' } }),
      ),
    );

    expect(resultat.status).toBe(400);
    expect(resultat.data).toEqual({ message: 'Identifiants invalides' });
  });
});

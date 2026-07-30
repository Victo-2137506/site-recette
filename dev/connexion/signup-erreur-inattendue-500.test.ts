import { describe, it, expect, vi } from 'vitest';
import { evenementFormulaire, echec } from '../helpers/evenement';
import { mocks } from '../helpers/mocks';
import { actions } from '../../src/routes/connexion/+page.server';

describe('action signUpEmail', () => {
  it('renvoie un 500 générique pour une erreur qui n’est pas une APIError', async () => {
    mocks.auth.api.signUpEmail = vi.fn(async () => {
      throw new Error('Base de données injoignable');
    });

    const resultat = echec(
      await actions.signUpEmail(
        evenementFormulaire({
          champs: { email: 'carole@test.fr', password: 'motdepasse', name: 'Carole' },
        }),
      ),
    );

    expect(resultat.status).toBe(500);
    expect(resultat.data).toEqual({ message: 'Erreur inattendue' });
  });
});

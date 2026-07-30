import { describe, it, expect, vi } from 'vitest';
import { evenementFormulaire, echec } from '../helpers/evenement';
import { mocks } from '../helpers/mocks';
import { actions } from '../../src/routes/connexion/+page.server';

describe('action signInEmail', () => {
  it('renvoie un 500 générique pour une erreur qui n’est pas une APIError', async () => {
    // Panne réseau, base injoignable... : on ne veut pas exposer le détail
    // technique à l'utilisateur, d'où le message générique.
    mocks.auth.api.signInEmail = vi.fn(async () => {
      throw new Error('Base de données injoignable');
    });

    const resultat = echec(
      await actions.signInEmail(
        evenementFormulaire({ champs: { email: 'alice@test.fr', password: 'motdepasse' } }),
      ),
    );

    expect(resultat.status).toBe(500);
    expect(resultat.data).toEqual({ message: 'Erreur inattendue' });
  });
});

// Tous les cas de `src/routes/connexion/+page.server.ts` : l'accès à la page,
// la connexion et l'inscription.

import { describe, it, expect, vi } from 'vitest';
import { isRedirect } from '@sveltejs/kit';
import { APIError } from 'better-auth/api';
import {
  evenement,
  evenementFormulaire,
  attraper,
  echec,
  sansVoid,
} from '../helpers/evenement';
import { mocks } from '../helpers/mocks';
import { load, actions } from '../../src/routes/connexion/+page.server';

describe('load de la page de connexion', () => {
  it('laisse passer un visiteur anonyme', async () => {
    // Aucune redirection : le formulaire de connexion doit s'afficher.
    const resultat = sansVoid(await load(evenement({ user: null })));

    expect(resultat).toEqual({});
  });

  it('redirige vers /profil si l’utilisateur est déjà connecté', async () => {
    const erreur = await attraper(() => load(evenement({ user: { id: 'u1' } })));

    expect(isRedirect(erreur)).toBe(true);
    expect(erreur.status).toBe(302);
    expect(erreur.location).toBe('/profil');
  });
});

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

  it('renvoie un 500 générique pour une erreur qui n’est pas une APIError', async () => {
    // Panne réseau, base injoignable... : on ne veut pas exposer le détail
    // technique à l'utilisateur, d'où le message générique.
    mocks.auth.api.signInEmail = vi.fn(async () => {
      throw new Error('Base de données injoignable');
    });

    const resultat = echec(
      await actions.signInEmail(
        evenementFormulaire({
          champs: { email: 'alice@test.fr', password: 'motdepasse' },
        }),
      ),
    );

    expect(resultat.status).toBe(500);
    expect(resultat.data).toEqual({ message: 'Erreur inattendue' });
  });
});

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

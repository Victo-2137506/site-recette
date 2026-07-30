import { describe, it, expect } from 'vitest';
import { isRedirect } from '@sveltejs/kit';
import { evenement, attraper } from '../helpers/evenement';
import { load } from '../../src/routes/connexion/+page.server';

describe('load de la page de connexion', () => {
  it('redirige vers /profil si l’utilisateur est déjà connecté', async () => {
    const erreur = await attraper(() => load(evenement({ user: { id: 'u1' } })));

    expect(isRedirect(erreur)).toBe(true);
    expect(erreur.status).toBe(302);
    expect(erreur.location).toBe('/profil');
  });
});

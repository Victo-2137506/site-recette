import { describe, it, expect } from 'vitest';
import { isRedirect } from '@sveltejs/kit';
import { evenement, attraper } from '../helpers/evenement';
import { load } from '../../src/routes/profil/+page.server';

describe('load du profil', () => {
  it('redirige vers /connexion si l’utilisateur n’est pas connecté', async () => {
    // Note : contrairement à « mes recettes » (303), le profil utilise un 302.
    const erreur = await attraper(() => load(evenement({ user: null })));

    expect(isRedirect(erreur)).toBe(true);
    expect(erreur.status).toBe(302);
    expect(erreur.location).toBe('/connexion');
  });
});

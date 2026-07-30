import { describe, it, expect } from 'vitest';
import { isRedirect } from '@sveltejs/kit';
import { evenement, attraper } from '../helpers/evenement';
import { load } from '../../src/routes/mes-recettes/creer/+page.server';

describe('load de la création de recette', () => {
  it('redirige vers /connexion si l’utilisateur n’est pas connecté', async () => {
    const erreur = await attraper(() => load(evenement({ user: null })));

    expect(isRedirect(erreur)).toBe(true);
    expect(erreur.status).toBe(303);
    expect(erreur.location).toBe('/connexion');
  });
});

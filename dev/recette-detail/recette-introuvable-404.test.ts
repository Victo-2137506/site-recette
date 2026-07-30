import { describe, it, expect } from 'vitest';
import { isHttpError } from '@sveltejs/kit';
import { evenement, attraper } from '../helpers/evenement';
import { load } from '../../src/routes/recettes/[id]/+page.server';

describe('load du détail d’une recette', () => {
  it('lève une 404 si la recette n’existe pas', async () => {
    const erreur = await attraper(() => load(evenement({ params: { id: '9999' } })));

    expect(isHttpError(erreur)).toBe(true);
    expect(erreur.status).toBe(404);
  });
});

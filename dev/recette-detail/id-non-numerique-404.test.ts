import { describe, it, expect } from 'vitest';
import { isHttpError } from '@sveltejs/kit';
import { evenement, attraper } from '../helpers/evenement';
import { load } from '../../src/routes/recettes/[id]/+page.server';

describe('load du détail d’une recette', () => {
  it('lève une 404 si l’identifiant n’est pas un nombre', async () => {
    const erreur = await attraper(() => load(evenement({ params: { id: 'abc' } })));

    expect(isHttpError(erreur)).toBe(true);
    expect(erreur.status).toBe(404);
  });
});

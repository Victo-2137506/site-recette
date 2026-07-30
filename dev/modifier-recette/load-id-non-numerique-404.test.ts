import { describe, it, expect } from 'vitest';
import { isHttpError } from '@sveltejs/kit';
import { evenement, attraper } from '../helpers/evenement';
import { load } from '../../src/routes/mes-recettes/[id]/modifier/+page.server';

describe('load de la modification de recette', () => {
  it('lève une 404 si l’identifiant n’est pas un nombre', async () => {
    const erreur = await attraper(() =>
      load(evenement({ user: { id: 'u1' }, params: { id: 'abc' } })),
    );

    expect(isHttpError(erreur)).toBe(true);
    expect(erreur.status).toBe(404);
  });
});

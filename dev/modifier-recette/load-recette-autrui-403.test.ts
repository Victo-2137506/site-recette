import { describe, it, expect } from 'vitest';
import { isHttpError } from '@sveltejs/kit';
import { evenement, attraper } from '../helpers/evenement';
import { load } from '../../src/routes/mes-recettes/[id]/modifier/+page.server';

describe('load de la modification de recette', () => {
  it('lève une 403 si la recette appartient à un autre utilisateur', async () => {
    // Alice (u1) tente d'ouvrir le formulaire de la recette 12, à Bob (u2).
    const erreur = await attraper(() =>
      load(evenement({ user: { id: 'u1' }, params: { id: '12' } })),
    );

    expect(isHttpError(erreur)).toBe(true);
    expect(erreur.status).toBe(403);
  });
});

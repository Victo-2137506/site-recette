import { describe, it, expect } from 'vitest';
import { isHttpError } from '@sveltejs/kit';
import { evenement, attraper } from '../helpers/evenement';
import { load } from '../../src/routes/profil/[id]/+page.server';

describe('load du profil public', () => {
  it('lève une 404 si l’utilisateur n’existe pas', async () => {
    const erreur = await attraper(() => load(evenement({ params: { id: 'inconnu' } })));

    expect(isHttpError(erreur)).toBe(true);
    expect(erreur.status).toBe(404);
  });
});

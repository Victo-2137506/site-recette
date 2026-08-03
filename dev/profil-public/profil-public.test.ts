// Tous les cas de `src/routes/profil/[id]/+page.server.ts` : la page publique
// d'un utilisateur, consultable par n'importe quel visiteur.

import { describe, it, expect } from 'vitest';
import { isHttpError } from '@sveltejs/kit';
import { evenement, attraper, sansVoid } from '../helpers/evenement';
import { load } from '../../src/routes/profil/[id]/+page.server';

describe('load du profil public', () => {
  it('retourne l’utilisateur ciblé et ses recettes', async () => {
    const resultat = sansVoid(await load(evenement({ params: { id: 'u1' } })));

    expect(resultat.utilisateur.nom).toBe('Alice');
    expect(resultat.recettes.map((r: { id: number }) => r.id)).toEqual([10, 11]);
  });

  it('ne fuite pas les recettes des autres utilisateurs', async () => {
    const resultat = sansVoid(await load(evenement({ params: { id: 'u2' } })));

    expect(
      resultat.recettes.every((r: { utilisateurId: string }) => r.utilisateurId === 'u2'),
    ).toBe(true);
  });

  it('lève une 404 si l’utilisateur n’existe pas', async () => {
    const erreur = await attraper(() => load(evenement({ params: { id: 'inconnu' } })));

    expect(isHttpError(erreur)).toBe(true);
    expect(erreur.status).toBe(404);
  });
});

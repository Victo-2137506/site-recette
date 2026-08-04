// Tous les cas de `src/routes/profil/+page.server.ts` : le profil de
// l'utilisateur connecté et sa déconnexion.

import { describe, it, expect } from 'vitest';
import { isRedirect } from '@sveltejs/kit';
import { evenement, attraper, sansVoid } from '../helpers/evenement';
import { mocks } from '../helpers/mocks';
import { base } from '../helpers/faux-db';
import { load, actions } from '../../src/routes/profil/+page.server';

describe('load du profil', () => {
  it('redirige vers /connexion si l’utilisateur n’est pas connecté', async () => {
    // Note : contrairement à « mes recettes » (303), le profil utilise un 302.
    const erreur = await attraper(() => load(evenement({ user: null })));

    expect(isRedirect(erreur)).toBe(true);
    expect(erreur.status).toBe(302);
    expect(erreur.location).toBe('/connexion');
  });

  it('retourne l’utilisateur connecté et uniquement ses recettes', async () => {
    const resultat = sansVoid(await load(evenement({ user: { id: 'u2', nom: 'Bob' } })));

    expect(resultat.user.id).toBe('u2');
    expect(resultat.recettes.map((r: { id: number }) => r.id)).toEqual([12]);
  });

  it('retourne les recettes aimées, y compris celles des autres utilisateurs', async () => {
    // Bob (u2) a aimé les recettes 10 et 11, toutes deux écrites par Alice.
    const resultat = sansVoid(await load(evenement({ user: { id: 'u2' } })));

    expect(
      resultat.recettesAimees.map((r: { id: number } | null) => r!.id),
    ).toEqual([10, 11]);
  });

  it('retourne une liste vide de recettes aimées pour un utilisateur qui n’a rien aimé', async () => {
    const resultat = sansVoid(
      await load(evenement({ user: { id: 'utilisateur-sans-jaime' } })),
    );

    expect(resultat.recettesAimees).toEqual([]);
  });

  it('n’affiche pas de case vide pour un j’aime dont la recette a disparu', async () => {
    // La route filtre les recettes nulles : sans ce garde-fou, la page
    // afficherait une carte vide.
    base().jaime.push({
      utilisateurId: 'u1',
      recetteId: 9999,
      creeLe: new Date('2026-01-04'),
    });

    const resultat = sansVoid(await load(evenement({ user: { id: 'u1' } })));

    expect(resultat.recettesAimees.map((r: { id: number } | null) => r!.id)).toEqual([
      10,
    ]);
  });
});

describe('action signOut du profil', () => {
  it('déconnecte l’utilisateur puis redirige vers /connexion', async () => {
    const erreur = await attraper(() =>
      actions.signOut(evenement({ headers: { cookie: 'session=abc' } })),
    );

    expect(mocks.auth.api.signOut).toHaveBeenCalledTimes(1);
    expect(isRedirect(erreur)).toBe(true);
    expect(erreur.status).toBe(302);
    expect(erreur.location).toBe('/connexion');
  });

  it('transmet les en-têtes de la requête à better-auth', async () => {
    // Sans le cookie de session, better-auth ne saurait pas quelle session fermer.
    await attraper(() => actions.signOut(evenement({ headers: { cookie: 'session=abc' } })));

    const argument = mocks.auth.api.signOut.mock.calls[0][0] as { headers: Headers };
    expect(argument.headers.get('cookie')).toBe('session=abc');
  });
});

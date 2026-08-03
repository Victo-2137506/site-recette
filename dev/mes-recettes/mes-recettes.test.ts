// Tous les cas de `src/routes/mes-recettes/+page.server.ts` : la liste des
// recettes de l'utilisateur connecté et leur suppression.

import { describe, it, expect } from 'vitest';
import { isRedirect } from '@sveltejs/kit';
import {
  evenement,
  evenementFormulaire,
  attraper,
  echec,
  sansVoid,
} from '../helpers/evenement';
import { base } from '../helpers/faux-db';
import { load, actions } from '../../src/routes/mes-recettes/+page.server';

describe('load de « mes recettes »', () => {
  it('redirige vers /connexion si l’utilisateur n’est pas connecté', async () => {
    const erreur = await attraper(() => load(evenement({ user: null })));

    expect(isRedirect(erreur)).toBe(true);
    expect(erreur.status).toBe(303);
    expect(erreur.location).toBe('/connexion');
  });

  it('ne retourne que les recettes de l’utilisateur connecté', async () => {
    // Alice (u1) possède 10 et 11 ; la recette 12 appartient à Bob.
    const resultat = sansVoid(await load(evenement({ user: { id: 'u1' } })));

    expect(resultat.recettes.map((r: { id: number }) => r.id)).toEqual([10, 11]);
  });

  it('retourne une liste vide pour un utilisateur sans recette', async () => {
    const resultat = sansVoid(
      await load(evenement({ user: { id: 'utilisateur-sans-recette' } })),
    );

    expect(resultat.recettes).toEqual([]);
  });
});

describe('action supprimer de « mes recettes »', () => {
  it('supprime la recette de l’utilisateur connecté', async () => {
    const resultat = await actions.supprimer(
      evenementFormulaire({ user: { id: 'u1' }, champs: { id: '11' } }),
    );

    expect(resultat).toEqual({ success: true });
    expect(base().recettes.map((r) => r.id)).toEqual([10, 12]);
  });

  it('refuse la suppression avec un 401 si l’utilisateur n’est pas connecté', async () => {
    const resultat = echec(
      await actions.supprimer(evenementFormulaire({ user: null, champs: { id: '10' } })),
    );

    expect(resultat.status).toBe(401);
    expect(resultat.data).toEqual({ message: 'Non connecté' });
    // La recette ne doit surtout pas avoir été supprimée.
    expect(base().recettes.map((r) => r.id)).toEqual([10, 11, 12]);
  });

  it('refuse avec un 403 la suppression de la recette d’un autre utilisateur', async () => {
    // Alice (u1) tente de supprimer la recette 12, qui appartient à Bob (u2).
    const resultat = echec(
      await actions.supprimer(
        evenementFormulaire({ user: { id: 'u1' }, champs: { id: '12' } }),
      ),
    );

    expect(resultat.status).toBe(403);
    expect(resultat.data).toEqual({ message: 'Action non autorisée' });
    expect(base().recettes.map((r) => r.id)).toContain(12);
  });

  it('renvoie un 403 pour une recette inexistante', async () => {
    // La route ne distingue pas « introuvable » de « pas à toi » : dans les
    // deux cas elle répond 403, ce qui évite de révéler l'existence d'un id.
    const resultat = echec(
      await actions.supprimer(
        evenementFormulaire({ user: { id: 'u1' }, champs: { id: '9999' } }),
      ),
    );

    expect(resultat.status).toBe(403);
    expect(resultat.data).toEqual({ message: 'Action non autorisée' });
  });
});

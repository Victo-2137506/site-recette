// Tous les cas de `src/routes/recettes/[id]/+page.server.ts` : l'affichage
// d'une recette et l'action « j'aime / je n'aime plus ».

import { describe, it, expect } from 'vitest';
import { isHttpError } from '@sveltejs/kit';
import { evenement, attraper, echec, sansVoid } from '../helpers/evenement';
import { base } from '../helpers/faux-db';
import { load, actions } from '../../src/routes/recettes/[id]/+page.server';

describe('load du détail d’une recette', () => {
  it('retourne la recette avec son auteur et ses ingrédients', async () => {
    const resultat = sansVoid(await load(evenement({ params: { id: '10' } })));

    expect(resultat.recette.titre).toBe('Poulet au riz');
    expect(resultat.recette.utilisateur.nom).toBe('Alice');
    expect(
      resultat.recette.recetteIngredients.map(
        (ri: { ingredient: { nom: string } }) => ri.ingredient.nom,
      ),
    ).toEqual(['Poulet', 'Riz']);
  });

  it('lève une 404 si l’identifiant n’est pas un nombre', async () => {
    const erreur = await attraper(() => load(evenement({ params: { id: 'abc' } })));

    expect(isHttpError(erreur)).toBe(true);
    expect(erreur.status).toBe(404);
  });

  it('lève une 404 si la recette n’existe pas', async () => {
    const erreur = await attraper(() => load(evenement({ params: { id: '9999' } })));

    expect(isHttpError(erreur)).toBe(true);
    expect(erreur.status).toBe(404);
  });

  it('retourne le nombre de j’aime de la recette', async () => {
    const resultat = sansVoid(await load(evenement({ params: { id: '10' } })));

    expect(resultat.nombreJaimes).toBe(2);
  });

  it('retourne 0 j’aime pour une recette que personne n’a aimée', async () => {
    const resultat = sansVoid(await load(evenement({ params: { id: '12' } })));

    expect(resultat.nombreJaimes).toBe(0);
  });

  it('indique `dejaAime` à false pour un visiteur anonyme', async () => {
    // Sans utilisateur connecté, la base n'est même pas interrogée : le bouton
    // s'affiche toujours dans son état « pas encore aimé ».
    const resultat = sansVoid(
      await load(evenement({ params: { id: '10' }, user: null })),
    );

    expect(resultat.dejaAime).toBe(false);
  });

  it('indique `dejaAime` à true quand l’utilisateur connecté a déjà aimé', async () => {
    const resultat = sansVoid(
      await load(evenement({ params: { id: '10' }, user: { id: 'u1' } })),
    );

    expect(resultat.dejaAime).toBe(true);
  });

  it('indique `dejaAime` à false quand un autre utilisateur a aimé, mais pas lui', async () => {
    // La recette 11 est aimée par Bob (u2) : Alice ne doit pas hériter de son like.
    const resultat = sansVoid(
      await load(evenement({ params: { id: '11' }, user: { id: 'u1' } })),
    );

    expect(resultat.nombreJaimes).toBe(1);
    expect(resultat.dejaAime).toBe(false);
  });
});

describe('action toggleLike', () => {
  it('refuse avec un 401 si l’utilisateur n’est pas connecté', async () => {
    const resultat = echec(
      await actions.toggleLike(evenement({ params: { id: '10' }, user: null })),
    );

    expect(resultat.status).toBe(401);
    expect(resultat.data).toEqual({
      message: 'Tu dois être connecté pour aimer une recette',
    });
    expect(base().jaime).toHaveLength(3);
  });

  it('refuse avec un 400 un identifiant de recette non numérique', async () => {
    const resultat = echec(
      await actions.toggleLike(
        evenement({ params: { id: 'abc' }, user: { id: 'u1' } }),
      ),
    );

    expect(resultat.status).toBe(400);
    expect(resultat.data).toEqual({ message: 'Recette invalide' });
    expect(base().jaime).toHaveLength(3);
  });

  it('ajoute le j’aime quand l’utilisateur n’a pas encore aimé', async () => {
    // Alice (u1) n'a pas encore aimé la recette 12.
    const resultat = await actions.toggleLike(
      evenement({ params: { id: '12' }, user: { id: 'u1' } }),
    );

    expect(resultat).toEqual({ success: true });
    expect(
      base().jaime.filter((j) => j.recetteId === 12 && j.utilisateurId === 'u1'),
    ).toHaveLength(1);
  });

  it('retire le j’aime quand l’utilisateur avait déjà aimé', async () => {
    // Alice (u1) a déjà aimé la recette 10 : un second clic annule son like.
    const resultat = await actions.toggleLike(
      evenement({ params: { id: '10' }, user: { id: 'u1' } }),
    );

    expect(resultat).toEqual({ success: true });
    expect(
      base().jaime.some((j) => j.recetteId === 10 && j.utilisateurId === 'u1'),
    ).toBe(false);
    // Le like de Bob sur la même recette ne doit pas être emporté.
    expect(
      base().jaime.some((j) => j.recetteId === 10 && j.utilisateurId === 'u2'),
    ).toBe(true);
  });

  it('deux clics successifs ramènent à l’état de départ', async () => {
    const evenementAlice = () =>
      evenement({ params: { id: '12' }, user: { id: 'u1' } });

    await actions.toggleLike(evenementAlice());
    await actions.toggleLike(evenementAlice());

    expect(base().jaime).toHaveLength(3);
    expect(
      base().jaime.some((j) => j.recetteId === 12 && j.utilisateurId === 'u1'),
    ).toBe(false);
  });
});

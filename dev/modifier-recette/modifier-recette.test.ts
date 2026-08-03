// Tous les cas de `src/routes/mes-recettes/[id]/modifier/+page.server.ts` :
// l'ouverture du formulaire pré-rempli et l'enregistrement des modifications.
//
// Comme à la création, le formulaire envoie un champ `etape` par bloc, que la
// route renumérote en un seul texte.

import { describe, it, expect } from 'vitest';
import { isRedirect, isHttpError } from '@sveltejs/kit';
import {
  evenement,
  evenementFormulaire,
  attraper,
  echec,
  sansVoid,
} from '../helpers/evenement';
import { base } from '../helpers/faux-db';
import {
  load,
  actions,
} from '../../src/routes/mes-recettes/[id]/modifier/+page.server';

describe('load de la modification de recette', () => {
  it('redirige vers /connexion si l’utilisateur n’est pas connecté', async () => {
    const erreur = await attraper(() =>
      load(evenement({ user: null, params: { id: '10' } })),
    );

    expect(isRedirect(erreur)).toBe(true);
    expect(erreur.status).toBe(303);
    expect(erreur.location).toBe('/connexion');
  });

  it('lève une 404 si l’identifiant n’est pas un nombre', async () => {
    const erreur = await attraper(() =>
      load(evenement({ user: { id: 'u1' }, params: { id: 'abc' } })),
    );

    expect(isHttpError(erreur)).toBe(true);
    expect(erreur.status).toBe(404);
  });

  it('lève une 404 si la recette n’existe pas', async () => {
    const erreur = await attraper(() =>
      load(evenement({ user: { id: 'u1' }, params: { id: '9999' } })),
    );

    expect(isHttpError(erreur)).toBe(true);
    expect(erreur.status).toBe(404);
  });

  it('lève une 403 si la recette appartient à un autre utilisateur', async () => {
    // Alice (u1) tente d'ouvrir le formulaire de la recette 12, à Bob (u2).
    const erreur = await attraper(() =>
      load(evenement({ user: { id: 'u1' }, params: { id: '12' } })),
    );

    expect(isHttpError(erreur)).toBe(true);
    expect(erreur.status).toBe(403);
  });

  it('retourne la recette du propriétaire avec ses associations et la liste des ingrédients', async () => {
    const resultat = sansVoid(
      await load(evenement({ user: { id: 'u1' }, params: { id: '10' } })),
    );

    expect(resultat.recette.titre).toBe('Poulet au riz');
    // Les associations pré-remplissent le formulaire (ingrédient, quantité, unité).
    expect(
      resultat.recette.recetteIngredients.map(
        (ri: { ingredientId: number }) => ri.ingredientId,
      ),
    ).toEqual([1, 2]);
    // La liste complète sert aux menus déroulants du formulaire.
    expect(resultat.ingredients).toHaveLength(3);
  });
});

describe('action de modification de recette', () => {
  it('refuse la modification avec un 401 si l’utilisateur n’est pas connecté', async () => {
    const resultat = echec(
      await actions.default(
        evenementFormulaire({
          user: null,
          params: { id: '10' },
          champs: { titre: 'Piraté', etape: 'Piraté' },
        }),
      ),
    );

    expect(resultat.status).toBe(401);
    expect(resultat.data).toEqual({ message: 'Non connecté' });
    expect(base().recettes.find((r) => r.id === 10)!.titre).toBe('Poulet au riz');
  });

  it('refuse un identifiant non numérique avec un 400', async () => {
    // Le `load` répond 404 pour ce cas, mais l'action répond 400 : c'est une
    // soumission mal formée, pas une page introuvable.
    const resultat = echec(
      await actions.default(
        evenementFormulaire({
          user: { id: 'u1' },
          params: { id: 'abc' },
          champs: { titre: 'Tarte', etape: 'Cuire' },
        }),
      ),
    );

    expect(resultat.status).toBe(400);
    expect(resultat.data).toEqual({ message: 'ID de recette invalide' });
  });

  it('refuse avec un 403 la modification de la recette d’un autre utilisateur', async () => {
    // Alice (u1) soumet le formulaire de la recette 12, qui est à Bob (u2).
    const resultat = echec(
      await actions.default(
        evenementFormulaire({
          user: { id: 'u1' },
          params: { id: '12' },
          champs: { titre: 'Volé', etape: 'Volé' },
        }),
      ),
    );

    expect(resultat.status).toBe(403);
    expect(resultat.data).toEqual({ message: 'Action non autorisée' });
    expect(base().recettes.find((r) => r.id === 12)!.titre).toBe('Riz sauté');
  });

  it('refuse un titre vide avec un 400', async () => {
    const resultat = echec(
      await actions.default(
        evenementFormulaire({
          user: { id: 'u1' },
          params: { id: '10' },
          champs: { titre: '', etape: 'Cuire' },
        }),
      ),
    );

    expect(resultat.status).toBe(400);
    expect(resultat.data).toEqual({
      message: 'Le titre et au moins une étape sont requis',
    });
    // La validation intervient avant l'écriture : rien ne doit avoir bougé.
    expect(base().recettes.find((r) => r.id === 10)!.titre).toBe('Poulet au riz');
    expect(base().recetteIngredients.filter((ri) => ri.recetteId === 10)).toHaveLength(2);
  });

  it('refuse une recette sans aucune étape avec un 400', async () => {
    const resultat = echec(
      await actions.default(
        evenementFormulaire({
          user: { id: 'u1' },
          params: { id: '10' },
          champs: { titre: 'Poulet au riz', etape: ['', '  '] },
        }),
      ),
    );

    expect(resultat.status).toBe(400);
    expect(resultat.data).toEqual({
      message: 'Le titre et au moins une étape sont requis',
    });
    expect(base().recetteIngredients.filter((ri) => ri.recetteId === 10)).toHaveLength(2);
  });

  it('met à jour la recette, remplace ses ingrédients et redirige vers la fiche', async () => {
    const erreur = await attraper(() =>
      actions.default(
        evenementFormulaire({
          user: { id: 'u1' },
          params: { id: '10' },
          champs: {
            titre: 'Poulet au riz revisité',
            description: 'Version épicée',
            etape: ['Faire revenir', 'Cuire longuement'],
            // La recette 10 avait Poulet (1) + Riz (2) ; on passe à Riz + Soja.
            ingredient_id: ['2', '3'],
            quantite: ['200', '1'],
            unite: ['g', 'c. à s.'],
          },
        }),
      ),
    );

    expect(base().recettes.find((r) => r.id === 10)).toMatchObject({
      titre: 'Poulet au riz revisité',
      description: 'Version épicée',
      etapes: '1. Faire revenir\n2. Cuire longuement',
      utilisateurId: 'u1',
    });

    // Les anciennes associations sont supprimées, pas seulement complétées.
    expect(base().recetteIngredients.filter((ri) => ri.recetteId === 10)).toEqual([
      { recetteId: 10, ingredientId: 2, quantite: '200', unite: 'g' },
      { recetteId: 10, ingredientId: 3, quantite: '1', unite: 'c. à s.' },
    ]);

    // Les autres recettes ne sont pas touchées.
    expect(base().recetteIngredients.filter((ri) => ri.recetteId === 12)).toHaveLength(2);

    expect(isRedirect(erreur)).toBe(true);
    expect(erreur.status).toBe(303);
    expect(erreur.location).toBe('/recettes/10');
  });

  it('laisse la recette sans aucun ingrédient si le formulaire n’en envoie plus', async () => {
    // Contrairement à la création, la modification n'exige pas d'ingrédient :
    // la suppression des anciennes associations a lieu, la réinsertion non.
    const erreur = await attraper(() =>
      actions.default(
        evenementFormulaire({
          user: { id: 'u1' },
          params: { id: '10' },
          champs: { titre: 'Riz nature', etape: 'Cuire le riz' },
        }),
      ),
    );

    expect(base().recettes.find((r) => r.id === 10)!.titre).toBe('Riz nature');
    expect(base().recetteIngredients.filter((ri) => ri.recetteId === 10)).toEqual([]);
    expect(isRedirect(erreur)).toBe(true);
    expect(erreur.location).toBe('/recettes/10');
  });

  it('conserve les j’aime reçus par la recette modifiée', async () => {
    // La modification touche la recette et ses ingrédients, jamais les likes.
    await attraper(() =>
      actions.default(
        evenementFormulaire({
          user: { id: 'u1' },
          params: { id: '10' },
          champs: { titre: 'Poulet au riz v2', etape: 'Cuire' },
        }),
      ),
    );

    expect(base().jaime.filter((j) => j.recetteId === 10)).toHaveLength(2);
  });
});

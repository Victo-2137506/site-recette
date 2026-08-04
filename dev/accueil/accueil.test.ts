// Tous les cas de `src/routes/+page.server.ts` : le filtrage par ingrédients
// et le compteur de « j'aime » affiché sur chaque carte.
//
// Depuis le découpage en préparations, les ingrédients ne sont plus rattachés
// à la recette mais à l'une de ses préparations : le filtrage passe donc par
// une jointure `recette_ingredients → preparations`.

import { describe, it, expect } from 'vitest';
import { evenement, sansVoid } from '../helpers/evenement';
import { base } from '../helpers/faux-db';
import { load } from '../../src/routes/+page.server';

// Raccourci : la liste des identifiants de recettes retournés.
const ids = (recettes: { id: number }[]) => recettes.map((r) => r.id);

describe("load de la page d'accueil — filtrage", () => {
  it('retourne toutes les recettes quand aucun ingrédient n’est coché', async () => {
    const resultat = sansVoid(await load(evenement({ url: 'http://localhost/' })));

    expect(ids(resultat.recettes)).toEqual([10, 11, 12]);
    expect(resultat.selectionIngredients).toEqual([]);
  });

  it('filtre sur un seul ingrédient', async () => {
    // Poulet (1) → « Poulet au riz » (10) et « Poulet rôti » (11)
    const resultat = sansVoid(
      await load(evenement({ url: 'http://localhost/?ingredient=1' })),
    );

    expect(ids(resultat.recettes).sort()).toEqual([10, 11]);
    expect(resultat.selectionIngredients).toEqual([1]);
  });

  it('ne garde que les recettes contenant TOUS les ingrédients cochés', async () => {
    // Poulet (1) + Riz (2) → seulement « Poulet au riz » (10).
    // « Poulet rôti » et « Riz sauté » n'en ont qu'un des deux : ils sont exclus.
    const resultat = sansVoid(
      await load(evenement({ url: 'http://localhost/?ingredient=1&ingredient=2' })),
    );

    expect(ids(resultat.recettes)).toEqual([10]);
  });

  it('trouve une recette dont les ingrédients cochés sont dans deux préparations différentes', async () => {
    // C'est tout l'intérêt de la jointure : dans « Poulet au riz » (10), le
    // poulet est dans la marinade et le riz dans la cuisson. Sans passer par
    // les préparations, aucune des deux ne contiendrait la sélection entière.
    const preparationsDeLaDix = base().preparations.filter((p) => p.recetteId === 10);
    expect(preparationsDeLaDix).toHaveLength(2);

    const resultat = sansVoid(
      await load(evenement({ url: 'http://localhost/?ingredient=1&ingredient=2' })),
    );

    expect(ids(resultat.recettes)).toEqual([10]);
  });

  it('retourne une liste vide quand aucune recette ne contient toute la sélection', async () => {
    // Poulet (1) + Soja (3) : aucune recette ne combine les deux.
    const resultat = sansVoid(
      await load(evenement({ url: 'http://localhost/?ingredient=1&ingredient=3' })),
    );

    expect(resultat.recettes).toEqual([]);
  });

  it('retourne une liste vide pour un identifiant d’ingrédient inexistant', async () => {
    const resultat = sansVoid(
      await load(evenement({ url: 'http://localhost/?ingredient=999' })),
    );

    expect(resultat.recettes).toEqual([]);
  });

  it('déduplique un ingrédient coché plusieurs fois dans l’URL', async () => {
    // Poulet (1) répété : la sélection ne doit compter qu'une seule fois,
    // sinon aucune recette n'atteindrait jamais le compte requis.
    const resultat = sansVoid(
      await load(evenement({ url: 'http://localhost/?ingredient=1&ingredient=1' })),
    );

    expect(resultat.selectionIngredients).toEqual([1]);
    expect(ids(resultat.recettes).sort()).toEqual([10, 11]);
  });

  it('ignore les paramètres `ingredient` non numériques', async () => {
    // `Number('abc')` vaut NaN : cette valeur est filtrée par `Number.isFinite`,
    // la sélection effective reste vide et toutes les recettes sont retournées.
    const resultat = sansVoid(
      await load(evenement({ url: 'http://localhost/?ingredient=abc' })),
    );

    expect(resultat.selectionIngredients).toEqual([]);
    expect(ids(resultat.recettes)).toEqual([10, 11, 12]);
  });

  it('retourne toujours la liste complète des ingrédients pour les cases à cocher', async () => {
    // Les cases à cocher doivent rester toutes affichées, même une fois un
    // filtre appliqué, sinon on ne pourrait plus élargir la sélection.
    const sansFiltre = sansVoid(await load(evenement({ url: 'http://localhost/' })));
    const avecFiltre = sansVoid(
      await load(evenement({ url: 'http://localhost/?ingredient=1' })),
    );

    expect(sansFiltre.ingredients).toHaveLength(3);
    expect(avecFiltre.ingredients).toHaveLength(3);
  });

  it('ne compte qu’une fois un ingrédient répété dans deux préparations', async () => {
    // La jointure ramène une ligne par association : sans dédoublonnage, deux
    // lignes « poulet » suffiraient à atteindre le compte de deux ingrédients
    // cochés. On ajoute donc du poulet dans une seconde préparation de
    // « Poulet rôti » (11), qui ne contient toujours pas de riz.
    base().preparations.push({
      id: 104,
      nom: 'Sauce',
      ordre: 1,
      etapes: '1. Réduire',
      recetteId: 11,
    });
    base().recetteIngredients.push({
      preparationId: 104,
      ingredientId: 1,
      quantite: '50',
      unite: 'g',
    });

    const resultat = sansVoid(
      await load(evenement({ url: 'http://localhost/?ingredient=1&ingredient=2' })),
    );

    // Seule la 10 possède réellement les deux ingrédients cochés.
    expect(ids(resultat.recettes)).toEqual([10]);
  });
});

describe("load de la page d'accueil — compteur de j'aime", () => {
  it('ajoute à chaque recette son nombre de j’aime', async () => {
    const resultat = sansVoid(await load(evenement({ url: 'http://localhost/' })));

    const comptes = Object.fromEntries(
      resultat.recettes.map((r: { id: number; nombreJaimes: number }) => [
        r.id,
        r.nombreJaimes,
      ]),
    );

    // La 10 est aimée par Alice et Bob, la 11 par Bob seulement.
    expect(comptes).toEqual({ 10: 2, 11: 1, 12: 0 });
  });

  it('compte aussi les j’aime des recettes filtrées', async () => {
    // Le compteur est calculé après le filtrage : il doit suivre.
    const resultat = sansVoid(
      await load(evenement({ url: 'http://localhost/?ingredient=1&ingredient=2' })),
    );

    expect(resultat.recettes).toHaveLength(1);
    expect(resultat.recettes[0].nombreJaimes).toBe(2);
  });
});

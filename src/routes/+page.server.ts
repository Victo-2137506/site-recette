import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import {
  recettes,
  ingredients,
  recetteIngredients,
  jaime,
} from '$lib/server/db/schema';
import { inArray, eq, count } from 'drizzle-orm';

// Ajoute le nombre de likes à chaque recette d'une liste, en une seule requête groupée
async function ajouterNombreJaimes(
  recettesListe: (typeof recettes.$inferSelect)[],
) {
  if (recettesListe.length === 0) {
    return [];
  }

  const idsRecettes = recettesListe.map((r) => r.id);

  // Compte les likes pour chaque recette d'un coup, plutôt qu'une requête par recette
  const compteurs = await db
    .select({ recetteId: jaime.recetteId, total: count() })
    .from(jaime)
    .where(inArray(jaime.recetteId, idsRecettes))
    .groupBy(jaime.recetteId);

  const compteursMap = new Map(compteurs.map((c) => [c.recetteId, c.total]));

  return recettesListe.map((recette) => ({
    ...recette,
    nombreJaimes: compteursMap.get(recette.id) ?? 0,
  }));
}

// Récupère les recettes et les ingrédients en fonction des ingrédients sélectionnés
export const load: PageServerLoad = async ({ url }) => {
  // On déduplique et on ignore les valeurs non numériques pour éviter
  // qu'un paramètre invalide ou répété ne fausse le comptage plus bas.
  const selectionIngredients = [
    ...new Set(url.searchParams.getAll('ingredient').map(Number)),
  ].filter(Number.isFinite);

  // Récupère tous les ingrédients de la base de données pour l'affichage des filtres
  const allIngredients = await db.select().from(ingredients);

  // Aucun filtre = toutes les recettes
  if (selectionIngredients.length === 0) {
    const allRecettes = await db.select().from(recettes);
    return {
      recettes: await ajouterNombreJaimes(allRecettes),
      ingredients: allIngredients,
      selectionIngredients,
    };
  }

  // Trouver les recettes qui contiennent TOUS les ingrédients cochés
  const rows = await db
    .select({
      recetteId: recetteIngredients.recetteId,
    })
    .from(recetteIngredients)
    .where(inArray(recetteIngredients.ingredientId, selectionIngredients));

  // Compter combien d'ingrédients cochés chaque recette possède
  const countMap = new Map<number, number>();

  // Parcourt les lignes récupérées et met à jour le compteur pour chaque recette
  for (const row of rows) {
    countMap.set(row.recetteId, (countMap.get(row.recetteId) ?? 0) + 1);
  }

  // Garder uniquement les recettes qui ont TOUS les ingrédients cochés
  const validRecetteIds = [...countMap.entries()]
    .filter(([_, count]) => count === selectionIngredients.length)
    .map(([id]) => id);

  // Récupérer les recettes finales
  const filteredRecettes = await db
    .select()
    .from(recettes)
    .where(inArray(recettes.id, validRecetteIds));

  // Retourne les recettes filtrées, tous les ingrédients et les ingrédients sélectionnés pour l'affichage
  return {
    recettes: await ajouterNombreJaimes(filteredRecettes),
    ingredients: allIngredients,
    selectionIngredients,
  };
};

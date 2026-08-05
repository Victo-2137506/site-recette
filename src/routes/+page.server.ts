import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import {
  recettes,
  preparations,
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

  // Récupère les IDs des recettes
  const idsRecettes = recettesListe.map((r) => r.id);

  // Compte les likes pour chaque recette
  const compteurs = await db
    .select({ recetteId: jaime.recetteId, total: count() })
    .from(jaime)
    .where(inArray(jaime.recetteId, idsRecettes))
    .groupBy(jaime.recetteId);

  // Chaque recette à ses propres likes
  const compteursMap = new Map(compteurs.map((c) => [c.recetteId, c.total]));

  return recettesListe.map((recette) => ({
    ...recette,
    nombreJaimes: compteursMap.get(recette.id) ?? 0,
  }));
}

// Récupère les recettes et les ingrédients en fonction des ingrédients sélectionnés
export const load: PageServerLoad = async ({ url }) => {
  // Récupère les ingrédients sélectionnés depuis l'URL
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

  // Récupère les recettes qui contiennent tous les ingrédients sélectionnés
  const rows = await db
    .select({
      recetteId: preparations.recetteId,
      ingredientId: recetteIngredients.ingredientId,
    })
    .from(recetteIngredients)
    .innerJoin(
      preparations,
      eq(preparations.id, recetteIngredients.preparationId),
    )
    .where(inArray(recetteIngredients.ingredientId, selectionIngredients));

  // Trouver les ingredients trouvés pour chaque recette
  const ingredientsParRecette = new Map<number, Set<number>>();

  // Parcourt les lignes récupérées et note l'ingrédient trouvé pour sa recette
  for (const row of rows) {
    if (!ingredientsParRecette.has(row.recetteId)) {
      ingredientsParRecette.set(row.recetteId, new Set());
    }
    ingredientsParRecette.get(row.recetteId)!.add(row.ingredientId);
  }

  // Garder uniquement les recettes qui ont TOUS les ingrédients cochés
  const validRecetteIds = [...ingredientsParRecette.entries()]
    .filter(([_, trouves]) => trouves.size === selectionIngredients.length)
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

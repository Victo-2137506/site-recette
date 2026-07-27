import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import {
  recettes,
  ingredients,
  recetteIngredients,
} from '$lib/server/db/schema';
import { inArray } from 'drizzle-orm';

export const load: PageServerLoad = async ({ url }) => {
  const selectedIngredients = url.searchParams.getAll('ingredient').map(Number);

  const allIngredients = await db.select().from(ingredients);

  // Aucun filtre = toutes les recettes
  if (selectedIngredients.length === 0) {
    const allRecettes = await db.select().from(recettes);
    return {
      recettes: allRecettes,
      ingredients: allIngredients,
      selectedIngredients,
    };
  }

  // Trouver les recettes qui contiennent TOUS les ingrédients cochés
  const rows = await db
    .select({
      recetteId: recetteIngredients.recetteId,
    })
    .from(recetteIngredients)
    .where(inArray(recetteIngredients.ingredientId, selectedIngredients));

  // Compter combien d'ingrédients cochés chaque recette possède
  const countMap = new Map<number, number>();

  for (const row of rows) {
    countMap.set(row.recetteId, (countMap.get(row.recetteId) ?? 0) + 1);
  }

  // Garder uniquement les recettes qui ont TOUS les ingrédients cochés
  const validRecetteIds = [...countMap.entries()]
    .filter(([_, count]) => count === selectedIngredients.length)
    .map(([id]) => id);

  // Récupérer les recettes finales
  const filteredRecettes = await db
    .select()
    .from(recettes)
    .where(inArray(recettes.id, validRecetteIds));

  return {
    recettes: filteredRecettes,
    ingredients: allIngredients,
    selectedIngredients,
  };
};

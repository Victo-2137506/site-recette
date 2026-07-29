import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { recettes } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
  const id = Number(params.id);

  if (Number.isNaN(id)) {
    throw error(404, 'Recette introuvable');
  }
  // Récupère la recette avec l'ID correspondant, ainsi que les informations de l'utilisateur et les ingrédients associés
  const recette = await db.query.recettes.findFirst({
    where: eq(recettes.id, id),
    with: {
      utilisateur: true,
      recetteIngredients: {
        with: { ingredient: true },
      },
    },
  });

  if (!recette) {
    throw error(404, 'Recette introuvable');
  }

  return { recette };
};
